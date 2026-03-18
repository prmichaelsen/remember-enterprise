/**
 * Thread metadata for tracking thread statistics and state.
 * Stored in: agentbase.conversations/{conversationId}/thread_metadata/{parentMessageId}
 */
export interface ThreadMetadata {
  parent_message_id: string           // ID of top-level message that started the thread
  reply_count: number                 // Total number of thread replies
  participant_user_ids: string[]      // Users who've replied in the thread (or followed)
  last_reply_at: string               // ISO timestamp of most recent reply
  last_reply_by_user_id: string       // User ID of most recent replier
  unread_by_user: Record<string, number>  // { userId: unreadCount }
  created_at: string                  // ISO timestamp when first reply was added
  updated_at: string                  // ISO timestamp of last metadata update
}

/**
 * Lightweight thread indicator data for rendering reply count badges.
 */
export interface ThreadIndicator {
  parent_message_id: string
  reply_count: number
  last_reply_at: string
  last_reply_by_user_id: string
  unread_count?: number  // For current user only
}
