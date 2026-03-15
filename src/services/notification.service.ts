/**
 * Notification Service — client-side API wrappers for notification operations.
 * Server-side Firestore logic lives in notification-database.service.ts.
 */

import type { Notification, NotificationType } from '@/types/notifications'

export interface CreateNotificationParams {
  type: NotificationType
  title: string
  body: string
  conversation_id?: string | null
}

/**
 * Create a notification (typically called server-side, but exposed for completeness).
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to create notification (${res.status})`)
  }
  return res.json()
}

/**
 * Fetch notifications for the current user.
 */
export async function getNotifications(
  options: { limit?: number; offset?: number } = {},
): Promise<Notification[]> {
  const qs = new URLSearchParams({
    limit: String(options.limit ?? 20),
    offset: String(options.offset ?? 0),
  })
  const res = await fetch(`/api/notifications?${qs}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications (${res.status})`)
  }
  const data = await res.json()
  return data.notifications ?? []
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count')
  if (!res.ok) return 0
  const data = await res.json()
  return data.count ?? 0
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`Failed to mark notification as read (${res.status})`)
  }
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<number> {
  const res = await fetch('/api/notifications/read-all', {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`Failed to mark all notifications as read (${res.status})`)
  }
  const data = await res.json()
  return data.count ?? 0
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const res = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete notification (${res.status})`)
  }
}
