/**
 * Chat Engine
 *
 * Lightweight, provider-agnostic chat orchestration engine.
 * Accepts an IAIProvider and optionally an IMCPProvider to coordinate
 * message processing with streaming and MCP tool execution.
 *
 * When an MCPProvider is present and a userId is supplied:
 *   1. Discovers available MCP servers for the user
 *   2. Connects to them and fetches available tools
 *   3. Passes tools to the AI provider (Anthropic) via the tools parameter
 *   4. Handles tool_use responses: executes via MCPProvider, sends results back
 *   5. Repeats until the model produces a final text response
 */

import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ContentBlockParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { createAnthropicClient } from './create-client'
import type { IAIProvider, ChatMessage, StreamEvent } from './types'
import type { IMCPProvider, Tool } from './interfaces/mcp-provider'

const MODEL_ID = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 4096
const TEMPERATURE = 0

/** Parameters for processMessage */
export interface ProcessMessageParams {
  /** Full conversation history (including the new user message) */
  messages: ChatMessage[]
  /** System prompt to send to the model */
  systemPrompt: string
  /** Callback invoked for each stream event */
  onEvent: (event: StreamEvent) => void
  /** Optional abort signal for cancellation */
  signal?: AbortSignal
  /** User ID - required for MCP tool integration */
  userId?: string
}

export class ChatEngine {
  private provider: IAIProvider
  private mcpProvider?: IMCPProvider
  private apiKey?: string

  constructor(provider: IAIProvider, options?: { mcpProvider?: IMCPProvider; apiKey?: string }) {
    this.provider = provider
    this.mcpProvider = options?.mcpProvider
    this.apiKey = options?.apiKey
  }

  private debug(onEvent: (event: StreamEvent) => void, message: string, data?: Record<string, unknown>) {
    onEvent({ type: 'debug', message, data })
  }

  /**
   * Process a conversation through the AI provider and yield stream events
   * via the onEvent callback.
   */
  async processMessage(params: ProcessMessageParams): Promise<void> {
    const { messages, systemPrompt, onEvent, signal, userId } = params

    // If no MCP provider or no userId, use the simple path
    if (!this.mcpProvider || !userId) {
      this.debug(onEvent, 'No MCP provider or userId, using simple streaming path')
      await this.provider.streamChat({
        messages,
        systemPrompt,
        onMessage: onEvent,
        signal,
      })
      return
    }

    // MCP-enabled path: discover servers, connect, get tools, then call Anthropic with tools
    let mcpConnections: Awaited<ReturnType<IMCPProvider['connectToServers']>> = []
    let mcpTools: Tool[] = []

    try {
      const mcpDebug = (message: string, data: any) => this.debug(onEvent, `[MCP] ${message}`, data)
      this.debug(onEvent, 'Discovering MCP servers', { userId })
      const servers = await this.mcpProvider.getAvailableServers({ userId, onDebug: mcpDebug })
      this.debug(onEvent, 'MCP servers discovered', { count: servers.length, servers: servers.map(s => ({ id: s.id, name: s.name, provider: s.provider })) })

      if (servers.length > 0) {
        this.debug(onEvent, 'Connecting to MCP servers')
        mcpConnections = await this.mcpProvider.connectToServers({
          servers,
          userId,
          onDebug: mcpDebug,
        })
        mcpTools = await this.mcpProvider.getTools(mcpConnections)
        this.debug(onEvent, 'MCP tools loaded', { toolCount: mcpTools.length, tools: mcpTools.map(t => t.name) })
      }
    } catch (error) {
      this.debug(onEvent, 'MCP setup failed, proceeding without tools', {
        error: error instanceof Error ? error.message : String(error),
      })
    }

    if (mcpTools.length === 0) {
      this.debug(onEvent, 'No tools available, using simple streaming')
      await this.provider.streamChat({
        messages,
        systemPrompt,
        onMessage: onEvent,
        signal,
      })
      return
    }

    // Tools available — use Anthropic SDK directly with tool support
    this.debug(onEvent, 'Starting tool-enabled streaming', { toolCount: mcpTools.length })
    await this.streamWithTools({
      messages,
      systemPrompt,
      tools: mcpTools,
      onEvent,
      signal,
    })
  }

  /**
   * Stream a conversation with tool support.
   * Handles the tool_use → executeTool → tool_result loop.
   */
  private async streamWithTools(params: {
    messages: ChatMessage[]
    systemPrompt: string
    tools: Tool[]
    onEvent: (event: StreamEvent) => void
    signal?: AbortSignal
  }): Promise<void> {
    const { messages, systemPrompt, tools, onEvent, signal } = params

    const client = createAnthropicClient(this.apiKey)

    // Convert tools to Anthropic format
    const anthropicTools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema as Anthropic.Messages.Tool.InputSchema,
    }))

    // Build initial message list
    const anthropicMessages: MessageParam[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    let inputTokens = 0
    let outputTokens = 0

    // Tool execution loop: keep calling until we get a text-only response
    const MAX_TOOL_ROUNDS = 10
    let round = 0

    while (round < MAX_TOOL_ROUNDS) {
      round++
      this.debug(onEvent, 'Starting tool round', { round, maxRounds: MAX_TOOL_ROUNDS })

      // Collect content blocks from the stream
      const contentBlocks: Array<{ type: string; [key: string]: unknown }> = []
      let currentTextContent = ''
      let stopReason: string | null = null

      try {
        const stream = await client.messages.stream(
          {
            model: MODEL_ID,
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE,
            system: systemPrompt,
            messages: anthropicMessages,
            tools: anthropicTools,
          },
          signal ? { signal } : undefined,
        )

        // Track current content block index for accumulation
        let currentBlockIndex = -1
        let currentToolInput = ''
        let currentToolName = ''
        let currentToolId = ''

        for await (const event of stream) {
          // Capture usage from message_start
          if (event.type === 'message_start' && (event as any).message?.usage) {
            inputTokens += (event as any).message.usage.input_tokens ?? 0
          }

          // Capture usage from message_delta
          if (event.type === 'message_delta' && (event as any).usage) {
            outputTokens += (event as any).usage.output_tokens ?? 0
          }

          // Track stop reason
          if (event.type === 'message_delta' && (event as any).delta?.stop_reason) {
            stopReason = (event as any).delta.stop_reason
          }

          // Content block start
          if (event.type === 'content_block_start') {
            currentBlockIndex = (event as any).index
            const block = (event as any).content_block
            if (block.type === 'tool_use') {
              currentToolName = block.name
              currentToolId = block.id
              currentToolInput = ''
              this.debug(onEvent, 'Tool use block started', { toolName: block.name, toolId: block.id })
            }
          }

          // Text content chunks
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            currentTextContent += event.delta.text
            onEvent({ type: 'chunk', content: event.delta.text })
          }

          // Tool input accumulation
          if (
            event.type === 'content_block_delta' &&
            (event.delta as any).type === 'input_json_delta'
          ) {
            currentToolInput += (event.delta as any).partial_json
          }

          // Content block stop — finalize tool_use blocks
          if (event.type === 'content_block_stop') {
            if (currentToolName && currentToolId) {
              let parsedInput: Record<string, unknown> = {}
              try {
                parsedInput = currentToolInput
                  ? JSON.parse(currentToolInput)
                  : {}
              } catch {
                parsedInput = {}
              }

              contentBlocks.push({
                type: 'tool_use',
                id: currentToolId,
                name: currentToolName,
                input: parsedInput,
              })

              // Emit tool_call event for SSE streaming
              onEvent({
                type: 'tool_call',
                name: currentToolName,
                input: parsedInput,
              } as StreamEvent)

              // Reset
              currentToolName = ''
              currentToolId = ''
              currentToolInput = ''
            } else if (currentTextContent) {
              contentBlocks.push({
                type: 'text',
                text: currentTextContent,
              })
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          this.debug(onEvent, 'Stream aborted by client')
          onEvent({ type: 'complete' })
          return
        }
        this.debug(onEvent, 'Stream error', { error: error instanceof Error ? error.message : String(error) })
        onEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        return
      }

      // Check if we need to execute tools
      const toolUseBlocks = contentBlocks.filter((b) => b.type === 'tool_use')

      if (toolUseBlocks.length === 0 || stopReason !== 'tool_use') {
        this.debug(onEvent, 'No more tool calls, finishing', { stopReason, toolUseBlockCount: toolUseBlocks.length })
        break
      }

      // Execute tool calls and collect results
      // Add assistant message with all content blocks
      anthropicMessages.push({
        role: 'assistant',
        content: contentBlocks as unknown as ContentBlockParam[],
      })

      // Execute each tool and build tool_result blocks
      const toolResults: ToolResultBlockParam[] = []

      for (const block of toolUseBlocks) {
        const toolName = block.name as string
        const toolInput = block.input as Record<string, unknown>
        const toolUseId = block.id as string

        this.debug(onEvent, 'Executing tool', { toolName, toolUseId })

        try {
          const result = await this.mcpProvider!.executeTool({
            toolName,
            toolInput,
            connections: [],
          })

          this.debug(onEvent, 'Tool execution succeeded', { toolName })

          // Emit tool_result event
          onEvent({
            type: 'tool_result',
            name: toolName,
            result,
          } as StreamEvent)

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          })
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error)

          this.debug(onEvent, 'Tool execution failed', { toolName, error: errorMsg })

          onEvent({
            type: 'tool_result',
            name: toolName,
            result: { error: errorMsg },
          } as StreamEvent)

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            is_error: true,
            content: errorMsg,
          })
        }
      }

      // Add tool results as user message
      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      })

      // Reset text content for next round
      currentTextContent = ''
    }

    // Emit usage before complete
    if (inputTokens > 0 || outputTokens > 0) {
      this.debug(onEvent, 'Token usage', { inputTokens, outputTokens })
      onEvent({
        type: 'usage',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      })
    }

    onEvent({ type: 'complete' })
  }
}
