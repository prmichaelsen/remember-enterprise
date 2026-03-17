/**
 * WebSocket message protocol — discriminated union for typed messaging.
 *
 * Covers both legacy message types and new ChatRoom DO protocol
 * (message, chunk, complete, messages_loaded, etc.)
 */

import type { Message, MessageContent } from '@/types/conversations'

// ── Client → Server messages ────────────────────────────────────────

export interface ClientInitMessage {
  type: 'init'
  userId: string
  conversationId: string
  /** Ghost owner user ID for ghost/persona conversations (e.g., 'space:the_void') */
  ghostOwner?: string
}

export interface ClientChatMessage {
  type: 'message'
  userId: string
  conversationId: string
  message: MessageContent
  /** Ghost owner user ID for ghost/persona conversations (e.g., 'space:the_void') */
  ghostOwner?: string
}

export interface ClientLoadMessagesMessage {
  type: 'load_messages'
  userId: string
  conversationId: string
  limit?: number
  startAfter?: string
  /** Ghost owner user ID for ghost/persona conversations (e.g., 'space:the_void') */
  ghostOwner?: string
}

export interface ClientCancelMessage {
  type: 'cancel'
  userId?: string
  conversationId?: string
}

export type ClientWebSocketMessage =
  | ClientInitMessage
  | ClientChatMessage
  | ClientLoadMessagesMessage
  | ClientCancelMessage
  | TypingEvent

// ── Server → Client messages (new ChatRoom DO protocol) ─────────────

export interface ServerMessageEvent {
  type: 'message'
  message: Message
}

export interface ServerChunkEvent {
  type: 'chunk'
  content: string
}

export interface ServerCompleteEvent {
  type: 'complete'
}

export interface ServerCancelledEvent {
  type: 'cancelled'
}

export interface ServerErrorEvent {
  type: 'error'
  error: string
}

export interface ServerMessagesLoadedEvent {
  type: 'messages_loaded'
  messages: Message[]
  hasMore: boolean
}

export interface ServerReadyEvent {
  type: 'ready'
}

export interface ServerGenerationInProgressEvent {
  type: 'generation_in_progress'
}

export interface ServerConversationTypeEvent {
  type: 'conversation_type'
  conversationType: 'chat' | 'dm' | 'group'
}

export interface ServerToolCallEvent {
  type: 'tool_call'
  toolCall: { id: string; name: string; input: Record<string, unknown> }
}

export interface ServerToolResultEvent {
  type: 'tool_result'
  toolResult: { id: string; output: unknown }
}

export interface ServerDebugEvent {
  type: 'debug'
  debug: { step: string; data: unknown }
}

// ── Legacy message types (kept for backward compat) ─────────────────

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop'
  conversation_id: string
  user_id: string
  user_name: string
}

export interface PresenceEvent {
  type: 'presence_update'
  user_id: string
  status: 'online' | 'offline' | 'away'
}

// ── Union of all server message types ───────────────────────────────

export type WebSocketMessage =
  | ServerMessageEvent
  | ServerChunkEvent
  | ServerCompleteEvent
  | ServerCancelledEvent
  | ServerErrorEvent
  | ServerMessagesLoadedEvent
  | ServerReadyEvent
  | ServerGenerationInProgressEvent
  | ServerConversationTypeEvent
  | ServerToolCallEvent
  | ServerToolResultEvent
  | ServerDebugEvent
  | TypingEvent
  | PresenceEvent

// For backward compat with WebSocketManager.send()
export type WebSocketMessageType = WebSocketMessage['type']

// ── Config ──────────────────────────────────────────────────────────

export interface WebSocketConfig {
  url: string
  conversationId: string
  reconnectMaxRetries: number
  reconnectBaseDelay: number
  reconnectMaxDelay: number
}
