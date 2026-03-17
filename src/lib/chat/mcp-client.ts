/**
 * MCP Client Module
 *
 * Handles connections to MCP servers and tool fetching using @modelcontextprotocol/sdk.
 * Ported from agentbase.me with simplifications (static servers only).
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { ProgressNotificationSchema } from '@modelcontextprotocol/sdk/types.js'
import type { Tool } from './interfaces/mcp-provider'

/** MCP server connection configuration */
export interface MCPServerConfig {
  /** MCP server URL */
  url: string
  /** Access token for authentication */
  accessToken: string
  /** Provider name (e.g., 'remember') */
  provider: string
  /** Transport type */
  transport?: 'sse' | 'http'
}

/** MCP connection wrapper (internal type with real Client) */
export interface MCPClientConnection {
  /** MCP client instance */
  client: Client
  /** Provider name */
  provider: string
  /** Server URL */
  url: string
  /** JWT access token */
  accessToken?: string
  /** Service token for JWT regeneration */
  serviceToken?: string
  /** User ID for JWT regeneration */
  userId?: string
  /** Token expiration timestamp (Unix ms) */
  expiresAt?: number
  /** Mutable reference to transport headers for token refresh */
  _transportHeaders?: Record<string, string>
}

/** MCP server discovery result */
interface MCPServerInfo {
  messageEndpoint: string
  transport: 'sse' | 'http'
  name?: string
  version?: string
}

/**
 * Discover MCP server endpoints and capabilities.
 * Calls GET on the base URL to retrieve server metadata.
 */
export async function discoverMCPServer(baseUrl: string): Promise<MCPServerInfo> {
  try {
    const response = await fetch(baseUrl)
    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status} ${response.statusText}`)
    }

    const info: Record<string, unknown> = await response.json()

    let messageEndpoint = baseUrl
    let transport: 'sse' | 'http' = 'http'

    if (info.endpoints && typeof info.endpoints === 'object') {
      const endpoints = info.endpoints as Record<string, string>
      if (endpoints.message) {
        const parts = endpoints.message.split(' ')
        if (parts.length >= 2) {
          const method = parts[0].toUpperCase()
          const path = parts[1]
          const baseUrlObj = new URL(baseUrl)
          messageEndpoint = `${baseUrlObj.origin}${path}`
          transport = method === 'POST' ? 'http' : 'sse'
        }
      }
    }

    return {
      messageEndpoint,
      transport,
      name: info.name as string | undefined,
      version: info.version as string | undefined,
    }
  } catch {
    // Fallback to base URL with HTTP transport
    return {
      messageEndpoint: baseUrl,
      transport: 'http',
    }
  }
}

/**
 * Connect to an MCP server.
 */
export async function connectToMCPServer(
  config: MCPServerConfig,
): Promise<MCPClientConnection> {
  // Discover server endpoints
  let messageEndpoint = config.url
  let transportType = config.transport || 'http'

  const discovered = await discoverMCPServer(config.url)
  messageEndpoint = discovered.messageEndpoint

  if (!config.transport) {
    transportType = discovered.transport
  }

  // Build headers with auth
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
  }

  // Create transport based on type
  const transport =
    transportType === 'http'
      ? new StreamableHTTPClientTransport(new URL(messageEndpoint), {
          requestInit: { headers },
        })
      : new SSEClientTransport(new URL(messageEndpoint), {
          requestInit: { headers },
        })

  // Create MCP client
  const client = new Client(
    { name: 'remember-enterprise', version: '1.0.0' },
    { capabilities: {} },
  )

  // Connect
  await client.connect(transport)

  return {
    client,
    provider: config.provider,
    url: messageEndpoint,
    _transportHeaders: headers,
  }
}

/**
 * Get tools from multiple MCP server connections.
 * Returns tools in Anthropic-compatible format plus a tool-to-connection map.
 */
export async function getToolsFromMCPServers(
  connections: MCPClientConnection[],
): Promise<{
  tools: Tool[]
  toolToConnectionMap: Map<string, MCPClientConnection>
}> {
  const allTools: Tool[] = []
  const toolToConnectionMap = new Map<string, MCPClientConnection>()
  const seenToolNames = new Set<string>()

  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      const result = await connection.client.listTools()
      return { connection, tools: result.tools }
    }),
  )

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[mcp-client] Failed to fetch tools:', result.reason)
      continue
    }

    const { connection, tools } = result.value

    for (const tool of tools) {
      if (seenToolNames.has(tool.name)) {
        console.warn(
          `[mcp-client] Duplicate tool "${tool.name}" from ${connection.provider}, skipping`,
        )
        continue
      }

      allTools.push({
        name: tool.name,
        description: tool.description || `Tool from ${connection.provider}`,
        input_schema: tool.inputSchema as Tool['input_schema'],
      })

      toolToConnectionMap.set(tool.name, connection)
      seenToolNames.add(tool.name)
    }
  }

  return { tools: allTools, toolToConnectionMap }
}

/**
 * Execute a tool call on the appropriate MCP server.
 */
export async function executeMCPTool(
  toolName: string,
  input: Record<string, unknown>,
  toolToConnectionMap: Map<string, MCPClientConnection>,
  ghostOwner?: string,
  onProgress?: (progress: {
    progress?: number
    total?: number
    message?: string
  }) => void,
): Promise<unknown> {
  const connection = toolToConnectionMap.get(toolName)
  if (!connection) {
    throw new Error(`No MCP connection found for tool: ${toolName}`)
  }

  // Add ghost context headers if ghostOwner is provided
  if (ghostOwner && connection._transportHeaders) {
    // Parse ghostOwner format: 'space:the_void' → type=space, id=the_void
    const [ghostType, ghostId] = ghostOwner.split(':', 2)

    connection._transportHeaders['X-Internal-Type'] = 'ghost'
    connection._transportHeaders['X-Ghost-Type'] = ghostType

    // Set the appropriate ID header based on ghost type
    if (ghostType === 'space') {
      connection._transportHeaders['X-Ghost-Space'] = ghostId
    } else if (ghostType === 'group') {
      connection._transportHeaders['X-Ghost-Group'] = ghostId
    } else if (ghostType === 'user') {
      connection._transportHeaders['X-Ghost-Owner'] = ghostId
    }
  }

  // Set up progress notification handler if callback provided
  if (onProgress) {
    connection.client.setNotificationHandler(
      ProgressNotificationSchema,
      (notification: any) => {
        onProgress({
          progress: notification.params.progress,
          total: notification.params.total,
          message: notification.params.message,
        })
      },
    )
  }

  const result = await connection.client.callTool({
    name: toolName,
    arguments: input,
  })

  return result.content
}

/**
 * Disconnect from all MCP servers.
 */
export async function disconnectFromMCPServers(
  connections: MCPClientConnection[],
): Promise<void> {
  for (const connection of connections) {
    try {
      await connection.client.close()
    } catch (error) {
      console.error(
        `[mcp-client] Failed to disconnect from ${connection.provider}:`,
        error,
      )
    }
  }
}
