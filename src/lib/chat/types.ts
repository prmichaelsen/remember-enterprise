/**
 * Chat Engine Types
 *
 * Core type definitions for the chat system:
 * - ChatMessage: conversation message format
 * - StreamEvent: events emitted during streaming
 * - IAIProvider: interface for AI provider implementations
 */

/** A content block in a message (text or tool_use) */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }

/** A single message in a conversation */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

/** Result returned from processMessage */
export interface ProcessMessageResult {
  /** Final content: string if no tools used, content block array if tools were used */
  content: string | ContentBlock[]
}

/** Events emitted during streaming chat responses */
export type StreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'complete' }
  | { type: 'error'; error: string }
  | { type: 'debug'; message: string; data?: Record<string, unknown> }
  | { type: 'usage'; input_tokens: number; output_tokens: number }
  | { type: 'tool_call'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: unknown }

/** Parameters for streaming a chat response */
export interface StreamChatParams {
  /** Conversation message history */
  messages: ChatMessage[]
  /** System prompt to prepend */
  systemPrompt: string
  /** Callback for stream events */
  onMessage: (event: StreamEvent) => void
  /** Optional abort signal for cancellation */
  signal?: AbortSignal
}

/** Interface that AI providers must implement */
export interface IAIProvider {
  /**
   * Stream a chat response given messages and a system prompt.
   * Emits StreamEvents via onMessage callback.
   */
  streamChat(params: StreamChatParams): Promise<void>
}
