/**
 * NotificationClientService — client-side REST API calls for notification
 * operations. Extracted from inline fetch() calls in AppShell.
 */

import type { Notification } from '@/hooks/useNotifications'

export const NotificationClientService = {
  async fetchNotifications(params: { limit: number }): Promise<Notification[]> {
    const res = await fetch(`/api/notifications?limit=${params.limit}`)
    if (!res.ok) return []
    return res.json()
  },

  async fetchUnreadCount(): Promise<number> {
    const res = await fetch('/api/notifications/unread-count')
    if (!res.ok) return 0
    const data = (await res.json()) as any
    return data.count ?? 0
  },

  async markAsRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
  },

  async markAllAsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'POST' })
  },

  async deleteNotification(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
  },
}
