/**
 * MCP Provider
 *
 * Implementation of IMCPProvider using Model Context Protocol SDK.
 * Simplified from agentbase.me: only supports static servers.
 *
 * Server discovery queries shared Firestore `mcp-servers` collection.
 * JWT tokens are signed with jsonwebtoken using the server's service_token.
 */

import jwt from 'jsonwebtoken'
import {
  queryDocuments,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import type {
  IMCPProvider,
  GetAvailableServersParams,
  ConnectToServersParams,
  ExecuteToolParams,
  MCPServer,
  MCPConnection,
  Tool,
} from './interfaces/mcp-provider'
import {
  connectToMCPServer,
  getToolsFromMCPServers,
  executeMCPTool,
  disconnectFromMCPServers,
  type MCPClientConnection,
} from './mcp-client'

/** Generate a JWT for MCP server authentication */
function generateMCPToken(userId: string, serviceToken: string): string {
  return jwt.sign(
    {
      userId,
      iss: 'memorycloud.chat',
      aud: 'mcp-server',
    },
    serviceToken,
    { expiresIn: '1h' },
  )
}

export class MCPProvider implements IMCPProvider {
  // Global server schema cache (shared across all MCPProvider instances)
  private static globalServerCache: Map<string, MCPServer> = new Map()

  // Internal actual connections and tool mapping
  private actualConnections: MCPClientConnection[] = []
  private toolToConnectionMap = new Map<string, MCPClientConnection>()

  // Per-instance caches
  private connectionCache: MCPClientConnection[] = []
  private serverCache: MCPServer[] = []
  private toolMapCache: Map<string, MCPClientConnection> = new Map()
  private toolDefsCache: Tool[] = []
  private cacheExpiry: number = 0
  private cacheUserId: string = ''
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  private updateGlobalServerCache(servers: MCPServer[]): void {
    const serverHash = servers
      .map((s) => s.id)
      .sort()
      .join(',')
    const cachedHash = Array.from(MCPProvider.globalServerCache.keys())
      .sort()
      .join(',')

    if (serverHash !== cachedHash || MCPProvider.globalServerCache.size === 0) {
      MCPProvider.globalServerCache.clear()
      for (const server of servers) {
        MCPProvider.globalServerCache.set(server.id, server)
      }
    }
  }

  async getAvailableServers(
    params: GetAvailableServersParams,
  ): Promise<MCPServer[]> {
    const { userId, onDebug } = params

    // Check cache
    const now = Date.now()
    if (
      now < this.cacheExpiry &&
      this.cacheUserId === userId &&
      this.serverCache.length > 0
    ) {
      onDebug?.('Using cached MCP server list', {
        userId,
        serverCount: this.serverCache.length,
      })
      return this.serverCache
    }

    // Query Firestore for active static MCP servers
    onDebug?.('Querying Firestore for MCP servers', { userId })

    const serverDocs = await queryDocuments('agentbase.mcp-servers', {
      where: [
        { field: 'status', op: '==', value: 'active' },
        { field: 'type', op: '==', value: 'static' },
      ],
    })

    const servers: MCPServer[] = serverDocs.map((doc) => ({
      id: doc.id,
      name: (doc.data as Record<string, unknown>).name as string,
      type: 'static' as const,
      provider: (doc.data as Record<string, unknown>).provider as string,
      endpoint: (doc.data as Record<string, unknown>).endpoint as string,
      transport: ((doc.data as Record<string, unknown>).transport as 'sse' | 'http') || 'http',
      service_token: (doc.data as Record<string, unknown>).service_token as
        | string
        | undefined,
      status: 'active' as const,
    }))

    // Update caches
    this.serverCache = servers
    this.cacheExpiry = now + this.CACHE_TTL
    this.cacheUserId = userId
    this.updateGlobalServerCache(servers)

    onDebug?.('MCP servers loaded', {
      userId,
      serverCount: servers.length,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        provider: s.provider,
      })),
    })

    return servers
  }

  async connectToServers(
    params: ConnectToServersParams,
  ): Promise<MCPConnection[]> {
    const { servers, userId, onDebug } = params

    // Check cache
    const now = Date.now()
    if (
      now < this.cacheExpiry &&
      this.cacheUserId === userId &&
      this.connectionCache.length > 0
    ) {
      onDebug?.('Using cached MCP connections', {
        userId,
        connectionCount: this.connectionCache.length,
      })

      // Refresh tokens proactively
      for (const conn of this.connectionCache) {
        this.ensureValidToken(conn)
      }

      this.actualConnections = this.connectionCache
      this.toolToConnectionMap = this.toolMapCache

      return this.connectionCache.map((conn) => ({
        provider: conn.provider,
        client: conn.client,
        accessToken: conn.accessToken,
        serviceToken: conn.serviceToken,
        userId: conn.userId,
        expiresAt: conn.expiresAt,
      }))
    }

    // Cache miss - create new connections
    onDebug?.('Creating new MCP connections', {
      userId,
      serverCount: servers.length,
    })

    this.actualConnections = []
    this.toolToConnectionMap.clear()
    this.toolMapCache.clear()
    this.toolDefsCache = []

    type ConnectionResult =
      | {
          success: true
          actualConnection: MCPClientConnection
          interfaceConnection: MCPConnection
        }
      | { success: false; error: unknown; server: MCPServer }

    const connectionPromises = servers.map(
      async (mcpServer): Promise<ConnectionResult> => {
        try {
          // Generate JWT token for the server
          const accessToken = generateMCPToken(
            userId,
            mcpServer.service_token || '',
          )
          const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour

          const actualConnection = await connectToMCPServer({
            url: mcpServer.endpoint,
            accessToken,
            provider: mcpServer.provider,
            transport: mcpServer.transport,
          })

          onDebug?.('Connected to MCP server', {
            id: mcpServer.id,
            provider: mcpServer.provider,
          })

          return {
            success: true,
            actualConnection: {
              ...actualConnection,
              accessToken,
              serviceToken: mcpServer.service_token,
              userId,
              expiresAt,
            },
            interfaceConnection: {
              provider: mcpServer.provider,
              client: actualConnection.client,
              transport: mcpServer.transport,
              accessToken,
              serviceToken: mcpServer.service_token,
              userId,
              expiresAt,
            },
          }
        } catch (error) {
          onDebug?.('MCP connection failed', {
            id: mcpServer.id,
            error: error instanceof Error ? error.message : String(error),
          })
          return { success: false, error, server: mcpServer }
        }
      },
    )

    const results = await Promise.allSettled(connectionPromises)

    const connections: MCPConnection[] = []

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        const value = result.value
        this.actualConnections.push(value.actualConnection)
        connections.push(value.interfaceConnection)
      } else if (result.status === 'rejected') {
        console.error('[MCPProvider] Connection promise rejected:', result.reason)
      }
    }

    // Update cache
    this.connectionCache = this.actualConnections
    this.cacheExpiry = now + this.CACHE_TTL
    this.cacheUserId = userId

    onDebug?.('MCP connections established', {
      total: servers.length,
      successful: connections.length,
      failed: servers.length - connections.length,
    })

    return connections
  }

  async getTools(_connections: MCPConnection[]): Promise<Tool[]> {
    // Return cached tool definitions if available
    if (this.toolDefsCache.length > 0 && this.toolMapCache.size > 0) {
      this.toolToConnectionMap = this.toolMapCache
      return this.toolDefsCache
    }

    const { tools, toolToConnectionMap } = await getToolsFromMCPServers(
      this.actualConnections,
    )

    this.toolToConnectionMap = toolToConnectionMap
    this.toolMapCache = new Map(toolToConnectionMap)

    const toolDefs: Tool[] = tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.input_schema,
    }))
    this.toolDefsCache = toolDefs

    return toolDefs
  }

  async executeTool(params: ExecuteToolParams): Promise<unknown> {
    const { toolName, toolInput, onProgress } = params

    // Proactively refresh token if expiring soon
    const connection = this.toolToConnectionMap.get(toolName)
    if (connection) {
      this.ensureValidToken(connection)
    }

    try {
      return await executeMCPTool(
        toolName,
        toolInput,
        this.toolToConnectionMap,
        onProgress,
      )
    } catch (error) {
      // Retry once if JWT expired
      if (this.isJWTExpiredError(error) && connection) {
        console.warn(
          `[MCPProvider] JWT expired for ${toolName}, refreshing and retrying`,
        )
        this.refreshToken(connection)
        return await executeMCPTool(
          toolName,
          toolInput,
          this.toolToConnectionMap,
        )
      }
      throw error
    }
  }

  async disconnect(_connections: MCPConnection[]): Promise<void> {
    await disconnectFromMCPServers(this.actualConnections)
    this.actualConnections = []
    this.toolToConnectionMap.clear()
  }

  /** Clear all caches. Call when MCP configuration changes. */
  clearCache(): void {
    this.serverCache = []
    this.connectionCache = []
    this.toolMapCache.clear()
    this.toolDefsCache = []
    this.cacheExpiry = 0
    this.cacheUserId = ''
  }

  private isJWTExpiredError(error: unknown): boolean {
    const msg =
      error instanceof Error ? error.message : String(error)
    return (
      msg.includes('JWT token has expired') ||
      msg.includes('token expired') ||
      msg.includes('jwt expired')
    )
  }

  private refreshToken(connection: MCPClientConnection): void {
    if (!connection.userId || !connection.serviceToken) return

    const newToken = generateMCPToken(connection.userId, connection.serviceToken)
    const newExpiresAt = Date.now() + 60 * 60 * 1000

    connection.accessToken = newToken
    connection.expiresAt = newExpiresAt

    if (connection._transportHeaders) {
      connection._transportHeaders['Authorization'] = `Bearer ${newToken}`
    }
  }

  private ensureValidToken(connection: MCPClientConnection): void {
    if (!connection.expiresAt) return

    const timeUntilExpiry = connection.expiresAt - Date.now()
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes

    if (timeUntilExpiry < refreshThreshold) {
      this.refreshToken(connection)
    }
  }
}
