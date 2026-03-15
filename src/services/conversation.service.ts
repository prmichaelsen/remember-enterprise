/**
 * Conversation Service — client-side API wrappers.
 * Follows library-services pattern: components call this, never fetch() directly.
 */

import type { Conversation, ConversationType, MessagePreview } from '@/types/conversations'

export interface CreateConversationParams {
  type: ConversationType
  participant_ids: string[]
  name?: string
  description?: string
  created_by: string
}

export interface ConversationListParams {
  user_id: string
  type?: 'all' | 'dm' | 'group' | 'solo'
  limit?: number
}

export interface ConversationListResult {
  conversations: Conversation[]
}

/**
 * Create a new conversation (DM or group).
 */
export async function createConversation(
  params: CreateConversationParams
): Promise<Conversation> {
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
  if (!res.ok) return { conversations: [] }
  return res.json()
}

/**
 * Get a single conversation by ID.
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  // Stub: Firestore read
  // const docSnap = await getDoc(doc(db, 'conversations', conversationId))
  // return docSnap.exists() ? (docSnap.data() as Conversation) : null
  void conversationId
  return null
}

/**
 * Update the last_message preview and updated_at timestamp.
 */
export async function updateLastMessage(
  conversationId: string,
  preview: MessagePreview
): Promise<void> {
  // Stub: Firestore update
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   last_message: preview,
  //   updated_at: new Date().toISOString(),
  // })
  void conversationId
  void preview
}

/**
 * Add a participant to a conversation.
 */
export async function addParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  // Stub: Firestore arrayUnion
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   participant_ids: arrayUnion(userId),
  // })
  void conversationId
  void userId
}

/**
 * Remove a participant from a conversation.
 */
export async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  // Stub: Firestore arrayRemove
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   participant_ids: arrayRemove(userId),
  // })
  void conversationId
  void userId
}

/**
 * Delete a conversation (soft-delete via flag, or hard delete).
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  // Stub: Firestore delete
  // await deleteDoc(doc(db, 'conversations', conversationId))
  void conversationId
}
