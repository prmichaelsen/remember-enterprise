/**
 * NotificationDatabaseService — server-side Firestore CRUD for notifications.
 * Collection path: users/{userId}/notifications
 */

import {
  getDocument,
  setDocument,
  queryDocuments,
  deleteDocument,
  addDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import type { QueryOptions } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import type { Notification, NotificationType } from '@/types/notifications'

function notificationsCollection(userId: string): string {
  return `agentbase.users/${userId}/notifications`
}

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body: string
  conversation_id?: string | null
}

export class NotificationDatabaseService {
  /**
   * Create a new notification.
   */
  static async create(input: CreateNotificationInput): Promise<Notification> {
    initFirebaseAdmin()
    const collection = notificationsCollection(input.user_id)
    const now = new Date().toISOString()

    const data = {
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      conversation_id: input.conversation_id ?? null,
      read: false,
      created_at: now,
    }

    const docRef = await addDocument(collection, data)
    return { id: docRef.id, ...data }
  }

  /**
   * List notifications for a user, ordered by most recent first.
   */
  static async listByUser(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    initFirebaseAdmin()
    const collection = notificationsCollection(userId)

    try {
      const options: QueryOptions = {
        orderBy: [{ field: 'created_at', direction: 'DESCENDING' }],
        limit,
      }

      const docs = await queryDocuments(collection, options)
      return docs.map((doc) => ({
        ...(doc.data as unknown as Notification),
        id: doc.id,
      }))
    } catch (error) {
      console.error('[NotificationDatabaseService] listByUser failed:', error)
      return []
    }
  }

  /**
   * Get the count of unread notifications for a user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    initFirebaseAdmin()
    const collection = notificationsCollection(userId)

    try {
      const docs = await queryDocuments(collection, {
        where: [{ field: 'read', op: '==', value: false }],
      })
      return docs.length
    } catch (error) {
      console.error('[NotificationDatabaseService] getUnreadCount failed:', error)
      return 0
    }
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    initFirebaseAdmin()
    const collection = notificationsCollection(userId)

    await setDocument(
      collection,
      notificationId,
      { read: true },
      { merge: true },
    )
  }

  /**
   * Mark all notifications as read for a user.
   */
  static async markAllAsRead(userId: string): Promise<number> {
    initFirebaseAdmin()
    const collection = notificationsCollection(userId)

    try {
      const docs = await queryDocuments(collection, {
        where: [{ field: 'read', op: '==', value: false }],
      })

      for (const doc of docs) {
        await setDocument(
          collection,
          doc.id,
          { read: true },
          { merge: true },
        )
      }

      return docs.length
    } catch (error) {
      console.error('[NotificationDatabaseService] markAllAsRead failed:', error)
      return 0
    }
  }

  /**
   * Delete a notification.
   */
  static async delete(notificationId: string, userId: string): Promise<void> {
    initFirebaseAdmin()
    const collection = notificationsCollection(userId)
    await deleteDocument(collection, notificationId)
  }
}
