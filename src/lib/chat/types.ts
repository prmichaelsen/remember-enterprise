/**
 * Chat Engine Types
 *
 * Core type definitions for the chat system:
 * - ChatMessage: conversation message format
 * - StreamEvent: events emitted during streaming
 * - IAIProvider: interface for AI provider implementations
 */

/** A single message in a conversation */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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
