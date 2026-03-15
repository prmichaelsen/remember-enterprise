/**
 * Message Service — send/receive messages, pagination, attachments.
 * Firestore calls are stubbed; interface is fully defined.
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
  const now = new Date().toISOString()
  const message: Message = {
    id: crypto.randomUUID(),
    conversation_id: params.conversation_id,
    sender_id: params.sender_id,
    sender_name: params.sender_name,
    sender_photo_url: params.sender_photo_url,
    content: params.content,
    created_at: now,
    updated_at: null,
    attachments: params.attachments ?? [],
    visible_to_user_ids: params.visible_to_user_ids ?? null,
    role: params.role ?? 'user',
    saved_memory_id: null,
  }

  // Stub: Firestore write
  // const docRef = doc(db, 'conversations', params.conversation_id, 'messages', message.id)
  // await setDoc(docRef, message)

  return message
}

/**
 * Fetch messages for a conversation with cursor-based pagination.
 * Returns messages in reverse chronological order (newest first).
 */
export async function listMessages(
  params: MessageListParams
): Promise<MessageListResult> {
  const { limit = 50 } = params

  // Stub: Firestore query
  // const q = query(
  //   collection(db, 'conversations', params.conversation_id, 'messages'),
  //   orderBy('created_at', 'desc'),
  //   limit(limit),
  //   ...(params.before_cursor ? [startAfter(params.before_cursor)] : [])
  // )
  // const snap = await getDocs(q)

  void limit
  return { messages: [], next_cursor: null, has_more: false }
}

/**
 * Get a single message by ID.
 */
export async function getMessage(
  conversationId: string,
  messageId: string
): Promise<Message | null> {
  // Stub: Firestore read
  // const docSnap = await getDoc(
  //   doc(db, 'conversations', conversationId, 'messages', messageId)
  // )
  // return docSnap.exists() ? (docSnap.data() as Message) : null
  void conversationId
  void messageId
  return null
}

/**
 * Update a message's content (for edits).
 */
export async function updateMessage(
  conversationId: string,
  messageId: string,
  content: string
): Promise<void> {
  // Stub: Firestore update
  // await updateDoc(
  //   doc(db, 'conversations', conversationId, 'messages', messageId),
  //   { content, updated_at: new Date().toISOString() }
  // )
  void conversationId
  void messageId
  void content
}

/**
 * Delete a message (soft-delete by clearing content, or hard delete).
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  // Stub: Firestore delete
  // await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId))
  void conversationId
  void messageId
}

/**
 * Mark all messages in a conversation as read for a user.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  // Stub: Firestore update on user's read-receipt subcollection
  // await setDoc(
  //   doc(db, 'users', userId, 'read_receipts', conversationId),
  //   { last_read_at: new Date().toISOString() }
  // )
  void conversationId
  void userId
}
