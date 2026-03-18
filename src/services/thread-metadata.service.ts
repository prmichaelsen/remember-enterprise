/**
 * ThreadMetadataService — server-side Firestore CRUD for thread metadata.
 *
 * Collection path: agentbase.conversations/{conversationId}/thread_metadata/{parentMessageId}
 */

import {
  getDocument,
  setDocument,
  updateDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { createLogger } from '@/lib/logger'
import type { ThreadMetadata } from '@/types/threads'

const log = createLogger('ThreadMetadataService')

const BASE = 'agentbase'

function threadMetadataCollection(conversationId: string): string {
  return `${BASE}.conversations/${conversationId}/thread_metadata`
}

export class ThreadMetadataService {
  /**
   * Get thread metadata for a parent message.
   * Returns null if thread metadata doesn't exist yet.
   */
  static async getMetadata(
    conversationId: string,
    parentMessageId: string,
  ): Promise<ThreadMetadata | null> {
    initFirebaseAdmin()
    const collection = threadMetadataCollection(conversationId)
    try {
      const doc = await getDocument(collection, parentMessageId)
      if (!doc) return null
      return doc as ThreadMetadata
    } catch (error) {
      log.error({ err: error, conversationId, parentMessageId }, 'getMetadata failed')
      return null
    }
  }

  /**
   * Create new thread metadata when first reply is sent.
   * Should only be called when metadata doesn't exist yet.
   */
  static async createMetadata(
    conversationId: string,
    parentMessageId: string,
    firstReplyUserId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = threadMetadataCollection(conversationId)
    const now = new Date().toISOString()

    const metadata: ThreadMetadata = {
      parent_message_id: parentMessageId,
      reply_count: 1,
      participant_user_ids: [firstReplyUserId],
      last_reply_at: now,
      last_reply_by_user_id: firstReplyUserId,
      unread_by_user: {}, // Initialize empty, will be populated by incrementReply
      created_at: now,
      updated_at: now,
    }

    try {
      await setDocument(collection, parentMessageId, metadata)
      log.info({ conversationId, parentMessageId }, 'Created thread metadata')
    } catch (error) {
      log.error({ err: error, conversationId, parentMessageId }, 'createMetadata failed')
      throw error
    }
  }

  /**
   * Increment reply count and update last reply info.
   * Creates metadata if it doesn't exist.
   * Updates participant list if replier is new.
   */
  static async incrementReply(
    conversationId: string,
    parentMessageId: string,
    replyUserId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = threadMetadataCollection(conversationId)
    const now = new Date().toISOString()

    try {
      const existing = await this.getMetadata(conversationId, parentMessageId)

      if (!existing) {
        // First reply - create metadata
        await this.createMetadata(conversationId, parentMessageId, replyUserId)
        return
      }

      // Update existing metadata
      const newParticipants = existing.participant_user_ids.includes(replyUserId)
        ? existing.participant_user_ids
        : [...existing.participant_user_ids, replyUserId]

      await updateDocument(collection, parentMessageId, {
        reply_count: existing.reply_count + 1,
        participant_user_ids: newParticipants,
        last_reply_at: now,
        last_reply_by_user_id: replyUserId,
        updated_at: now,
      })

      log.info(
        { conversationId, parentMessageId, replyCount: existing.reply_count + 1 },
        'Incremented thread reply count',
      )
    } catch (error) {
      log.error({ err: error, conversationId, parentMessageId }, 'incrementReply failed')
      throw error
    }
  }

  /**
   * Mark thread as read for a specific user.
   * Sets unread count to 0 for the given userId.
   */
  static async markAsRead(
    conversationId: string,
    parentMessageId: string,
    userId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = threadMetadataCollection(conversationId)
    const now = new Date().toISOString()

    try {
      const existing = await this.getMetadata(conversationId, parentMessageId)
      if (!existing) {
        log.warn({ conversationId, parentMessageId, userId }, 'markAsRead: metadata not found')
        return
      }

      const newUnreadByUser = { ...existing.unread_by_user, [userId]: 0 }

      await updateDocument(collection, parentMessageId, {
        unread_by_user: newUnreadByUser,
        updated_at: now,
      })

      log.info({ conversationId, parentMessageId, userId }, 'Marked thread as read')
    } catch (error) {
      log.error({ err: error, conversationId, parentMessageId, userId }, 'markAsRead failed')
      throw error
    }
  }

  /**
   * Increment unread count for all thread participants except the replier.
   * Called after a new reply is sent.
   */
  static async incrementUnread(
    conversationId: string,
    parentMessageId: string,
    replyUserId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = threadMetadataCollection(conversationId)
    const now = new Date().toISOString()

    try {
      const existing = await this.getMetadata(conversationId, parentMessageId)
      if (!existing) {
        log.warn({ conversationId, parentMessageId }, 'incrementUnread: metadata not found')
        return
      }

      // Increment unread for all participants except replier
      const newUnreadByUser: Record<string, number> = {}
      for (const userId of existing.participant_user_ids) {
        if (userId === replyUserId) {
          newUnreadByUser[userId] = 0 // Replier has no unread
        } else {
          const currentUnread = existing.unread_by_user[userId] ?? 0
          newUnreadByUser[userId] = currentUnread + 1
        }
      }

      await updateDocument(collection, parentMessageId, {
        unread_by_user: newUnreadByUser,
        updated_at: now,
      })

      log.info({ conversationId, parentMessageId, replyUserId }, 'Incremented unread counts')
    } catch (error) {
      log.error({ err: error, conversationId, parentMessageId }, 'incrementUnread failed')
      throw error
    }
  }
}
