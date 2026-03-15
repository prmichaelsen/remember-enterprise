/**
 * MCP Tool Invocation Service — server-side MCP tool execution via API.
 * Streams responses back via WebSocket for real-time rendering.
 */

export interface MCPTool {
  name: string
  description: string
  server: string
  inputSchema: Record<string, unknown>
}

export interface MCPToolInvocationParams {
  toolName: string
  args: Record<string, unknown>
  conversationId: string
  /** User ID for ACL — agent responses scoped to sender */
  userId: string
}

export interface MCPToolResult {
  toolName: string
  status: 'success' | 'error'
  content: string
  /** Raw structured output from the MCP server */
  rawOutput?: unknown
}

/**
 * MCPService — discover available tools and invoke them.
 *
 * Tool invocation is routed through the server API which connects to
 * configured MCP servers. Responses stream back via the existing
 * WebSocket connection (agent_response_chunk events).
 */
export const MCPService = {
  /**
   * List all available MCP tools for the current user.
   * Tools are cached server-side per user with 24h TTL.
   */
  async listTools(): Promise<MCPTool[]> {
    const res = await fetch('/api/mcp/tools')
    if (!res.ok) {
      throw new Error(`Failed to list MCP tools (${res.status})`)
    }
    const data = (await res.json()) as any
    return data.tools ?? []
  },

  /**
   * Invoke an MCP tool. The response streams back via WebSocket,
   * but this method returns the final result for inline display.
   *
   * The server-side handler:
   * 1. Validates tool name against available tools
   * 2. Connects to the appropriate MCP server (cached)
   * 3. Executes the tool with provided args
   * 4. Streams chunks via WebSocket (agent_response_chunk)
   * 5. Returns final result
   */
  async invokeTool(params: MCPToolInvocationParams): Promise<MCPToolResult> {
    const res = await fetch('/api/mcp/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: params.toolName,
        args: params.args,
        conversation_id: params.conversationId,
        user_id: params.userId,
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as any
      return {
        toolName: params.toolName,
        status: 'error',
        content: body.error ?? `Tool invocation failed (${res.status})`,
      }
    }
    return res.json()
  },

  /**
   * Get detailed schema for a specific tool.
   */
  async getToolSchema(toolName: string): Promise<MCPTool | null> {
    const res = await fetch(`/api/mcp/tools/${encodeURIComponent(toolName)}`)
    if (!res.ok) return null
    return res.json()
  },
}
