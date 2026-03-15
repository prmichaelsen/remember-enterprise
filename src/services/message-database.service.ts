/**
 * MessageDatabaseService — server-side Firestore CRUD for messages.
 * Collection path: conversations/{conversationId}/messages
 */

import {
  getDocument,
  setDocument,
  queryDocuments,
  deleteDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import type { QueryOptions } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import type { Message, MessageAttachment } from '@/types/conversations'

function messagesCollection(conversationId: string): string {
  return `conversations/${conversationId}/messages`
}

function readReceiptsCollection(userId: string): string {
  return `users/${userId}/read_receipts`
}

export interface SendMessageInput {
  sender_id: string
  sender_name: string
  sender_photo_url: string | null
  content: string
  attachments?: MessageAttachment[]
  visible_to_user_ids?: string[] | null
  role?: 'user' | 'assistant' | 'system'
}

export interface MessageListResult {
  messages: Message[]
  next_cursor: string | null
  has_more: boolean
}

export class MessageDatabaseService {
  /**
   * List messages for a conversation with cursor-based pagination.
   * Returns messages in reverse chronological order (newest first).
   */
  static async listMessages(
    conversationId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<MessageListResult> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)

    try {
      const options: QueryOptions = {
        orderBy: [{ field: 'created_at', direction: 'DESCENDING' }],
        limit: limit + 1,
      }
      if (cursor) {
        options.startAfter = [cursor]
      }

      const docs = await queryDocuments(collection, options)
      const hasMore = docs.length > limit
      const slice = hasMore ? docs.slice(0, limit) : docs

      const messages: Message[] = slice.map((doc) => ({
        ...(doc.data as unknown as Message),
        id: doc.id,
        conversation_id: conversationId,
      }))

      const nextCursor =
        hasMore && messages.length > 0
          ? messages[messages.length - 1].created_at
          : null

      return { messages, next_cursor: nextCursor, has_more: hasMore }
    } catch (error) {
      console.error('[MessageDatabaseService] listMessages failed:', error)
      return { messages: [], next_cursor: null, has_more: false }
    }
  }

  /**
   * Send a new message to a conversation.
   */
  static async sendMessage(
    conversationId: string,
    input: SendMessageInput,
  ): Promise<Message> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const message: Message = {
      id,
      conversation_id: conversationId,
      sender_id: input.sender_id,
      sender_name: input.sender_name,
      sender_photo_url: input.sender_photo_url,
      content: input.content,
      created_at: now,
      updated_at: null,
      attachments: input.attachments ?? [],
      visible_to_user_ids: input.visible_to_user_ids ?? null,
      role: input.role ?? 'user',
      saved_memory_id: null,
    }

    await setDocument(collection, id, message)
    return message
  }

  /**
   * Get a single message by ID.
   */
  static async getMessage(
    conversationId: string,
    messageId: string,
  ): Promise<Message | null> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)

    try {
      const doc = await getDocument(collection, messageId)
      if (!doc) return null
      return { ...(doc as unknown as Message), id: messageId, conversation_id: conversationId }
    } catch (error) {
      console.error('[MessageDatabaseService] getMessage failed:', error)
      return null
    }
  }

  /**
   * Update a message (e.g. content edits).
   */
  static async updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'saved_memory_id'>>,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)
    const now = new Date().toISOString()

    await setDocument(
      collection,
      messageId,
      { ...updates, updated_at: now },
      { merge: true },
    )
  }

  /**
   * Delete a message.
   */
  static async deleteMessage(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)
    await deleteDocument(collection, messageId)
  }

  /**
   * Mark a conversation as read for a user by writing a read receipt.
   */
  static async markConversationRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = readReceiptsCollection(userId)
    const now = new Date().toISOString()

    await setDocument(collection, conversationId, {
      last_read_at: now,
    })
  }
}
