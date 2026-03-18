/**
 * Notification types for in-app and push notifications.
 */

export type NotificationType =
  | 'new_dm'
  | 'group_message'
  | 'agent_response'
  | 'mention'
  | 'memory_saved'
  | 'friend_request'
  | 'friend_accepted'
  | 'thread_reply'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  conversation_id: string | null
  read: boolean
  created_at: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  push_enabled: boolean
  dm_notifications: boolean
  group_notifications: boolean
  agent_notifications: boolean
  mention_notifications: boolean
}
