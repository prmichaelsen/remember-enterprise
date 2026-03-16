/**
 * Message Service — client-side API wrappers for message operations.
 * Server-side Firestore logic lives in message-database.service.ts.
 */

import type { Message, MessageContent } from '@/types/conversations'

export interface SendMessageParams {
  conversation_id: string
  sender_user_id?: string
  content: MessageContent
  visible_to_user_ids?: string[] | null
  role?: 'user' | 'assistant' | 'system'
  metadata?: Message['metadata']
  is_tool_interaction?: boolean
}

export interface MessageListParams {
  conversation_id: string
  limit?: number
  before_cursor?: string
}

export interface MessageListResult {
  messages: Message[]
  next_cursor: string | null
  has_more: boolean
}

/**
 * Send a new message to a conversation.
 */
export async function sendMessage(params: SendMessageParams): Promise<Message> {
  const res = await fetch(`/api/conversations/${params.conversation_id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as any
    throw new Error(body.error ?? `Failed to send message (${res.status})`)
  }
  return res.json()
}

/**
 * Fetch messages for a conversation with cursor-based pagination.
 */
export async function listMessages(
  params: MessageListParams,
): Promise<MessageListResult> {
  const qs = new URLSearchParams({
    limit: String(params.limit ?? 50),
    ...(params.before_cursor ? { before_cursor: params.before_cursor } : {}),
  })
  const res = await fetch(
    `/api/conversations/${params.conversation_id}/messages?${qs}`,
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch messages (${res.status})`)
  }
  return res.json()
}

/**
 * Mark all messages in a conversation as read for the current user.
 */
export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/read`,
    { method: 'POST' },
  )
  if (!res.ok) {
    throw new Error(`Failed to mark conversation as read (${res.status})`)
  }
}
