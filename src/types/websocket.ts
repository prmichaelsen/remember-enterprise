/**
 * WebSocket message protocol — discriminated union for typed messaging.
 */

export type WebSocketMessageType =
  | 'message_new'
  | 'message_update'
  | 'message_delete'
  | 'typing_start'
  | 'typing_stop'
  | 'presence_update'
  | 'notification'
  | 'agent_response'
  | 'agent_response_chunk'

export type WebSocketMessage =
  | NewMessageEvent
  | TypingEvent
  | PresenceEvent
  | NotificationEvent
  | AgentResponseEvent
  | AgentResponseChunkEvent

export interface NewMessageEvent {
  type: 'message_new'
  conversation_id: string
  message: {
    id: string
    sender_id: string
    sender_name: string
    content: string
    created_at: string
    attachments: Array<{ id: string; name: string; url: string; type: string }>
    visible_to_user_ids: string[] | null
    role: 'user' | 'assistant' | 'system'
  }
}

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

export interface NotificationEvent {
  type: 'notification'
  notification: {
    id: string
    title: string
    body: string
    conversation_id: string | null
  }
}

export interface AgentResponseEvent {
  type: 'agent_response'
  conversation_id: string
  message: {
    id: string
    content: string
    tool_name: string | null
    visible_to_user_ids: string[]
  }
}

export interface AgentResponseChunkEvent {
  type: 'agent_response_chunk'
  conversation_id: string
  message_id: string
  chunk: string
}

export interface WebSocketConfig {
  url: string
  conversationId: string
  reconnectMaxRetries: number
  reconnectBaseDelay: number // ms
  reconnectMaxDelay: number // ms
}
