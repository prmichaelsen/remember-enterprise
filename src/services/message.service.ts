/**
 * Message Service — client-side API wrappers for message operations.
 * Server-side Firestore logic lives in message-database.service.ts.
 */

import type { Message, MessageAttachment } from '@/types/conversations'

export interface SendMessageParams {
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_photo_url: string | null
  content: string
  attachments?: MessageAttachment[]
  visible_to_user_ids?: string[] | null
  role?: 'user' | 'assistant' | 'system'
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
 * Get a single message by ID.
 */
export async function getMessage(
  conversationId: string,
  messageId: string,
): Promise<Message | null> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
  )
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to fetch message (${res.status})`)
  }
  return res.json()
}

/**
 * Update a message's content (for edits).
 */
export async function updateMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  )
  if (!res.ok) {
    throw new Error(`Failed to update message (${res.status})`)
  }
}

/**
 * Delete a message.
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
    { method: 'DELETE' },
  )
  if (!res.ok) {
    throw new Error(`Failed to delete message (${res.status})`)
  }
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
