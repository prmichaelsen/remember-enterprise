/**
 * Conversation Service — CRUD operations for conversations.
 * Firestore calls are stubbed; interface is fully defined.
 */

import type { Conversation, ConversationType, Message, MessagePreview } from '@/types/conversations'

export interface CreateConversationParams {
  type: ConversationType
  participant_ids: string[]
  name?: string
  description?: string
  created_by: string
}

export interface ConversationListParams {
  user_id: string
  limit?: number
  after_cursor?: string
}

export interface ConversationListResult {
  conversations: Conversation[]
  next_cursor: string | null
}

/**
 * Create a new conversation (DM or group).
 * For DMs, checks if a conversation already exists between the two users.
 */
export async function createConversation(
  params: CreateConversationParams
): Promise<Conversation> {
  // For DMs, check existing conversation first
  if (params.type === 'dm' && params.participant_ids.length === 2) {
    const existing = await findDmConversation(
      params.participant_ids[0],
      params.participant_ids[1]
    )
    if (existing) return existing
  }

  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    type: params.type,
    name: params.name ?? null,
    description: params.description ?? null,
    participant_ids: params.participant_ids,
    created_by: params.created_by,
    created_at: now,
    updated_at: now,
    last_message: null,
    unread_count: 0,
    is_discoverable: false,
  }

  // Stub: Firestore write
  // const docRef = doc(db, 'conversations', conversation.id)
  // await setDoc(docRef, conversation)

  return conversation
}

/**
 * Find an existing DM conversation between two users.
 */
export async function findDmConversation(
  userA: string,
  userB: string
): Promise<Conversation | null> {
  // Stub: Firestore query
  // const q = query(
  //   collection(db, 'conversations'),
  //   where('type', '==', 'dm'),
  //   where('participant_ids', 'array-contains', userA)
  // )
  // const snap = await getDocs(q)
  // return snap.docs.find(d => d.data().participant_ids.includes(userB))?.data() ?? null
  return null
}

/**
 * Fetch conversations for a user, ordered by last activity.
 */
export async function listConversations(
  params: ConversationListParams
): Promise<ConversationListResult> {
  const { limit = 30 } = params

  // Stub: Firestore query
  // const q = query(
  //   collection(db, 'conversations'),
  //   where('participant_ids', 'array-contains', params.user_id),
  //   orderBy('updated_at', 'desc'),
  //   limit(limit),
  //   ...(params.after_cursor ? [startAfter(params.after_cursor)] : [])
  // )
  // const snap = await getDocs(q)

  void limit
  return { conversations: [], next_cursor: null }
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
