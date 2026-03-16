/**
 * Conversation Service — client-side API wrappers.
 * Follows library-services pattern: components call this, never fetch() directly.
 */

import type { Conversation, ConversationEnvelope, ConversationType } from '@/types/conversations'
import type { ProfileSummary } from '@/lib/profile-map'

export interface CreateConversationParams {
  type: ConversationType
  participant_ids: string[]
  title?: string
  created_by: string
}

export interface ConversationListParams {
  user_id: string
  type?: 'all' | 'dm' | 'group' | 'solo'
  limit?: number
}

export interface ConversationListResult {
  conversations: Conversation[]
  profiles: Record<string, ProfileSummary>
}

/**
 * Create a new conversation (DM or group).
 * Returns envelope with conversation + participant profiles.
 */
export async function createConversation(
  params: CreateConversationParams
): Promise<ConversationEnvelope> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.statusText}`)
  return res.json()
}

/**
 * Fetch conversations for a user, ordered by last activity.
 */
export async function listConversations(
  params: ConversationListParams
): Promise<ConversationListResult> {
  const { type = 'all', limit = 50 } = params
  const res = await fetch(`/api/conversations?type=${type}&limit=${limit}`)
  if (!res.ok) return { conversations: [], profiles: {} }
  return res.json()
}

/**
 * Get a single conversation by ID.
 * Returns envelope with conversation + participant profiles.
 */
export async function getConversation(conversationId: string): Promise<ConversationEnvelope | null> {
  const res = await fetch(`/api/conversations/${conversationId}`)
  if (!res.ok) return null
  return res.json()
}

/**
 * Update the last_message preview and updated_at timestamp.
 */
export async function updateLastMessage(
  conversationId: string,
  preview: { content: string; sender_user_id: string; timestamp: string }
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}/last-message`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preview),
  })
}

/**
 * Add a participant to a conversation.
 */
export async function addParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
}

/**
 * Remove a participant from a conversation.
 */
export async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}/participants/${userId}`, {
    method: 'DELETE',
  })
}

/**
 * Delete a conversation (soft-delete via flag, or hard delete).
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await fetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}
