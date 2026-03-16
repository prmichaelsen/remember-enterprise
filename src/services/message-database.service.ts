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
import { createLogger } from '@/lib/logger'
import type { Message, MessageContent } from '@/types/conversations'

const log = createLogger('MessageDatabaseService')

function messagesCollection(conversationId: string): string {
  return `conversations/${conversationId}/messages`
}

function readReceiptsCollection(userId: string): string {
  return `users/${userId}/read_receipts`
}

export interface SendMessageInput {
  sender_user_id?: string
  content: MessageContent
  visible_to_user_ids?: string[] | null
  role?: 'user' | 'assistant' | 'system'
  metadata?: Message['metadata']
  is_tool_interaction?: boolean
  created_for_user_id?: string
}

export interface MessageListResult {
  messages: Message[]
  next_cursor: string | null
  has_more: boolean
}

/**
 * Normalize a Firestore document into the canonical Message shape.
 * Handles old documents that use `created_at`, `sender_id`, etc.
 */
function normalizeMessage(doc: any, id: string, conversationId: string): Message {
  return {
    id,
    conversation_id: conversationId,
    role: doc.role ?? 'user',
    content: doc.content ?? '',
    timestamp: doc.timestamp ?? doc.created_at ?? new Date().toISOString(),
    sender_user_id: doc.sender_user_id ?? doc.sender_id,
    visible_to_user_ids: doc.visible_to_user_ids ?? null,
    ...(doc.location && { location: doc.location }),
    ...(doc.toolCallId && { toolCallId: doc.toolCallId }),
    ...(doc.progressStream && { progressStream: doc.progressStream }),
    ...(doc.metadata && { metadata: doc.metadata }),
    ...(doc.created_for_user_id && { created_for_user_id: doc.created_for_user_id }),
    ...(doc.is_tool_interaction != null && { is_tool_interaction: doc.is_tool_interaction }),
    ...(doc.cancelled != null && { cancelled: doc.cancelled }),
  }
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
        orderBy: [{ field: 'timestamp', direction: 'DESCENDING' }],
        limit: limit + 1,
      }
      if (cursor) {
        options.startAfter = [cursor]
      }

      const docs = await queryDocuments(collection, options)
      const hasMore = docs.length > limit
      const slice = hasMore ? docs.slice(0, limit) : docs

      const messages: Message[] = slice.map((doc) =>
        normalizeMessage(doc.data, doc.id, conversationId),
      )

      const nextCursor =
        hasMore && messages.length > 0
          ? messages[messages.length - 1].timestamp
          : null

      return { messages, next_cursor: nextCursor, has_more: hasMore }
    } catch (error) {
      log.error({ err: error }, 'listMessages failed')
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
      role: input.role ?? 'user',
      content: input.content,
      timestamp: now,
      sender_user_id: input.sender_user_id,
      visible_to_user_ids: input.visible_to_user_ids ?? null,
      ...(input.metadata && { metadata: input.metadata }),
      ...(input.is_tool_interaction != null && { is_tool_interaction: input.is_tool_interaction }),
      ...(input.created_for_user_id && { created_for_user_id: input.created_for_user_id }),
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
      return normalizeMessage(doc, messageId, conversationId)
    } catch (error) {
      log.error({ err: error }, 'getMessage failed')
      return null
    }
  }

  /**
   * Update a message (e.g. content edits).
   */
  static async updateMessage(
    conversationId: string,
    messageId: string,
    updates: Partial<Pick<Message, 'content'>>,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = messagesCollection(conversationId)

    await setDocument(
      collection,
      messageId,
      { ...updates, metadata: { edited: true } },
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
