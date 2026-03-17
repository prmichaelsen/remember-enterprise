/**
 * MCP Provider Interface
 *
 * Abstraction for Model Context Protocol providers.
 * Enables swapping MCP implementations without changing chat logic.
 *
 * Simplified from agentbase.me: only supports static servers (no OAuth-dependent).
 */

export interface IMCPProvider {
  /** Get available MCP servers for a user */
  getAvailableServers(params: GetAvailableServersParams): Promise<MCPServer[]>

  /** Connect to MCP servers */
  connectToServers(params: ConnectToServersParams): Promise<MCPConnection[]>

  /** Get tools from active connections */
  getTools(connections: MCPConnection[]): Promise<Tool[]>

  /** Execute a tool on the appropriate MCP server */
  executeTool(params: ExecuteToolParams): Promise<unknown>

  /** Disconnect from all servers */
  disconnect(connections: MCPConnection[]): Promise<void>
}

export interface GetAvailableServersParams {
  userId: string
  onDebug?: (message: string, data: unknown) => void
}

export interface ConnectToServersParams {
  servers: MCPServer[]
  userId: string
  onDebug?: (message: string, data: unknown) => void
}

export interface ExecuteToolParams {
  toolName: string
  toolInput: Record<string, unknown>
  connections: MCPConnection[]
  ghostOwner?: string
  onStatusUpdate?: (status: ToolStatus) => void
  onProgress?: (progress: {
    progress?: number
    total?: number
    message?: string
  }) => void
}

export interface MCPServer {
  id: string
  name: string
  type: 'static'
  provider: string
  endpoint: string
  transport: 'sse' | 'http'
  service_token?: string
  status: 'active' | 'inactive'
}

export interface MCPConnection {
  provider: string
  client: unknown
  transport?: unknown
  accessToken?: string
  serviceToken?: string
  userId?: string
  expiresAt?: number
}

export interface Tool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolStatus {
  toolId: string
  status: 'taking_a_while' | 'timed_out'
  elapsedMs: number
}
