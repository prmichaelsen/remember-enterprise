/**
 * MessageDatabaseService — server-side Firestore CRUD for messages.
 *
 * Dual-collection routing (matches agentbase.me):
 *   DMs & groups (shared):  agentbase.conversations/{conversationId}/messages
 *   Solo chats (user-scoped): agentbase.users/{userId}/conversations/{conversationId}/messages
 */

import {
  getDocument,
  setDocument,
  addDocument,
  queryDocuments,
  deleteDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import type { QueryOptions } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { createLogger } from '@/lib/logger'
import type { Message, MessageContent, ConversationType } from '@/types/conversations'

const log = createLogger('MessageDatabaseService')

const BASE = 'agentbase'

function sharedMessagesCollection(conversationId: string): string {
  return `${BASE}.conversations/${conversationId}/messages`
}

function userMessagesCollection(userId: string, conversationId: string): string {
  return `${BASE}.users/${userId}/conversations/${conversationId}/messages`
}

function readReceiptsCollection(userId: string): string {
  return `agentbase.users/${userId}/read_receipts`
}

/**
 * Resolve the messages collection path based on conversation type.
 * DM/group → shared collection. Solo chat → user-scoped collection.
 * Matches agentbase.me's resolveMessagesPath() — no Firestore lookup, type-based routing.
 */
function resolveMessagesPath(
  conversationId: string,
  userId: string,
  conversationType?: ConversationType,
): string {
  if (conversationType === 'dm' || conversationType === 'group') {
    return sharedMessagesCollection(conversationId)
  }
  // Solo chat or unknown → user-scoped
  return userMessagesCollection(userId, conversationId)
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

/** Build a Message from a Firestore doc (mirrors agentbase.me pattern). */
function toMessage(doc: any, id: string, conversationId: string): Message {
  return { id, conversation_id: conversationId, ...doc } as Message
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
    userId?: string,
    conversationType?: ConversationType,
  ): Promise<MessageListResult> {
    initFirebaseAdmin()
    const collection = userId
      ? resolveMessagesPath(conversationId, userId, conversationType)
      : sharedMessagesCollection(conversationId)

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
        toMessage(doc.data, doc.id, conversationId),
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
    conversationType?: ConversationType,
  ): Promise<Message> {
    initFirebaseAdmin()
    // Use created_for_user_id for path routing if present (e.g. agent messages
    // saved to the user's collection), otherwise fall back to sender_user_id.
    const routingUserId = input.created_for_user_id ?? input.sender_user_id
    const collection = routingUserId
      ? resolveMessagesPath(conversationId, routingUserId, conversationType)
      : sharedMessagesCollection(conversationId)
    const now = new Date().toISOString()

    const messageData = {
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

    const docRef = await addDocument(collection, messageData)
    return { ...messageData, id: docRef.id } as Message
  }

  /**
   * Get a single message by ID.
   */
  static async getMessage(
    conversationId: string,
    messageId: string,
    userId?: string,
    conversationType?: ConversationType,
  ): Promise<Message | null> {
    initFirebaseAdmin()
    const collection = userId
      ? resolveMessagesPath(conversationId, userId, conversationType)
      : sharedMessagesCollection(conversationId)

    try {
      const doc = await getDocument(collection, messageId)
      if (!doc) return null
      return toMessage(doc, messageId, conversationId)
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
    userId?: string,
    conversationType?: ConversationType,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = userId
      ? resolveMessagesPath(conversationId, userId, conversationType)
      : sharedMessagesCollection(conversationId)

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
    userId?: string,
    conversationType?: ConversationType,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = userId
      ? resolveMessagesPath(conversationId, userId, conversationType)
      : sharedMessagesCollection(conversationId)
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
