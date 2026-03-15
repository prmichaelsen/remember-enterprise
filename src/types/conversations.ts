/**
 * Conversation & messaging types.
 * Mirrors agentbase.me conversation schema in Firestore.
 */

export type ConversationType = 'dm' | 'group'

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null // null for DMs (derived from participants)
  description: string | null
  participant_ids: string[]
  created_by: string
  created_at: string // ISO 8601
  updated_at: string
  last_message: MessagePreview | null
  unread_count: number // client-computed, not stored
  is_discoverable: boolean // false for private groups
}

export interface MessagePreview {
  content: string
  sender_id: string
  sender_name: string
  timestamp: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_photo_url: string | null
  content: string
  created_at: string // ISO 8601
  updated_at: string | null
  attachments: MessageAttachment[]
  /** null = visible to all; array = visible only to listed user IDs */
  visible_to_user_ids: string[] | null
  /** For @agent responses */
  role: 'user' | 'assistant' | 'system'
  /** Reference to saved memory (if message was saved) */
  saved_memory_id: string | null
}

export interface MessageAttachment {
  id: string
  name: string
  size: number
  type: string // MIME type
  url: string
  thumbnail_url: string | null
}

export interface GroupMember {
  user_id: string
  display_name: string
  photo_url: string | null
  auth_level: GroupAuthLevel
  permissions: GroupPermissions
  joined_at: string
}

export type GroupAuthLevel = 0 | 1 | 3 | 5 // owner | admin | editor | member

export interface GroupPermissions {
  can_read: boolean
  can_publish: boolean
  can_manage_members: boolean
  can_moderate: boolean
  can_kick: boolean
  can_ban: boolean
}

export const OWNER_PRESET: GroupPermissions = {
  can_read: true,
  can_publish: true,
  can_manage_members: true,
  can_moderate: true,
  can_kick: true,
  can_ban: true,
}

export const MEMBER_PRESET: GroupPermissions = {
  can_read: true,
  can_publish: true,
  can_manage_members: false,
  can_moderate: false,
  can_kick: false,
  can_ban: false,
}
