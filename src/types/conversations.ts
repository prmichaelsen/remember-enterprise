/**
 * Conversation & messaging types.
 * Message schema synced to agentbase.me canonical MessageSchema.
 */

export type ConversationType = 'dm' | 'group' | 'ghost'

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
  sender_user_id: string
  timestamp: string
}

// ── Content block types (matching agentbase.me schemas.ts) ──────────

export interface TextContentBlock {
  type: 'text'
  text: string
}

export interface ImageContentBlock {
  type: 'image'
  source: {
    type: 'base64'
    media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
    data: string
  }
}

export interface StorageImageContentBlock {
  type: 'storage_image'
  source: {
    type: 'storage'
    mediaId: string
    signedUrl: string
    expiresAt: string
    storagePath: string
    media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
    previewSignedUrl?: string
    previewStoragePath?: string
  }
}

export interface StorageFileContentBlock {
  type: 'storage_file'
  source: {
    type: 'storage'
    mediaId: string
    signedUrl: string
    expiresAt: string
    storagePath: string
    media_type: string
    fileName: string
    fileSize: number
  }
}

export interface ToolUseContentBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, any>
}

export interface ToolResultContentBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

export interface MemoryCarouselContentBlock {
  type: 'memory_carousel'
  memoryIds: string[]
  toolName: string
  scores?: Record<string, number>
}

export type ContentBlock =
  | TextContentBlock
  | ImageContentBlock
  | StorageImageContentBlock
  | StorageFileContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock
  | MemoryCarouselContentBlock

export type MessageContent = string | ContentBlock[]

// ── ToolCall & ProgressStream for metadata ──────────────────────────

export interface ToolCall {
  id: string
  name: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  input?: Record<string, any>
  output?: any
  error?: string
}

export interface ProgressStream {
  command: string
  status: 'running' | 'complete' | 'failed'
  output: string
  progress?: number
  elapsedMs: number
  exitCode?: number
  error?: string
}

// ── Message — synced to agentbase.me MessageSchema ──────────────────

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
  timestamp: string
  location?: { lat: number; lng: number } | null
  toolCallId?: string
  progressStream?: ProgressStream
  metadata?: {
    tool_calls?: ToolCall[]
    error?: string
    regenerated?: boolean
    edited?: boolean
    import_job?: { jobId: string; filename?: string }
    ingest_job?: { jobId: string; rootUrl: string }
  } | null
  sender_user_id?: string
  visible_to_user_ids?: string[] | null
  created_for_user_id?: string
  is_tool_interaction?: boolean
  cancelled?: boolean
}

// ── Group types ─────────────────────────────────────────────────────

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

export const ADMIN_PRESET: GroupPermissions = {
  can_read: true,
  can_publish: true,
  can_manage_members: true,
  can_moderate: true,
  can_kick: true,
  can_ban: false,
}

export const EDITOR_PRESET: GroupPermissions = {
  can_read: true,
  can_publish: true,
  can_manage_members: false,
  can_moderate: true,
  can_kick: false,
  can_ban: false,
}

export const MEMBER_PRESET: GroupPermissions = {
  can_read: true,
  can_publish: true,
  can_manage_members: false,
  can_moderate: false,
  can_kick: false,
  can_ban: false,
}
