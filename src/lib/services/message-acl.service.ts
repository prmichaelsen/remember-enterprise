/**
 * MessageAclService — message-level visibility filtering.
 * Implements the agentbase.me pattern:
 *   visible_to_user_ids: null = visible to all members
 *   visible_to_user_ids: [senderId] = private (e.g., @agent responses)
 *   visible_to_user_ids: [...userIds] = visible to specific users only
 */

import type { Message } from '@/types/conversations'
import { isMember, canRead } from '@/lib/services/group-acl.service'

/**
 * Check whether a specific message is visible to a given user.
 * - If visible_to_user_ids is null, the message is visible to all group members.
 * - If visible_to_user_ids is an array, the user must be in the list.
 * - The sender always sees their own messages.
 */
export function isMessageVisibleToUser(
  message: Message,
  userId: string
): boolean {
  // Sender always sees their own messages
  if (message.sender_user_id === userId) return true

  // null/undefined = visible to all members
  if (!message.visible_to_user_ids) return true

  // Array = restricted visibility
  return message.visible_to_user_ids.includes(userId)
}

/**
 * Filter a list of messages to only those visible to a given user.
 * This is the primary function used when loading messages for display.
 */
export function filterVisibleMessages(
  messages: Message[],
  userId: string
): Message[] {
  return messages.filter((msg) => isMessageVisibleToUser(msg, userId))
}

/**
 * Check whether a user can view messages in a conversation.
 * Combines group membership check with the can_read permission.
 */
export async function canViewMessages(
  conversationId: string,
  userId: string
): Promise<boolean> {
  return canRead(conversationId, userId)
}

/**
 * Build visible_to_user_ids for an @agent mention response.
 * The agent's response should only be visible to the sender.
 */
export function buildAgentResponseVisibility(senderId: string): string[] {
  return [senderId]
}

/**
 * Build visible_to_user_ids for a whisper/private message to specific users.
 * Includes the sender so they can see their own message.
 */
export function buildPrivateVisibility(
  senderId: string,
  recipientIds: string[]
): string[] {
  const ids = new Set([senderId, ...recipientIds])
  return Array.from(ids)
}

/**
 * Check if a message is private (has restricted visibility).
 */
export function isPrivateMessage(message: Message): boolean {
  return message.visible_to_user_ids != null
}

/**
 * Check if a message is an @agent private response.
 * These are messages from the assistant role with restricted visibility.
 */
export function isAgentPrivateResponse(message: Message): boolean {
  return (
    message.role === 'assistant' &&
    message.visible_to_user_ids != null &&
    message.visible_to_user_ids.length === 1
  )
}

/**
 * Full access check: verify that a user can view a specific message
 * in a conversation. Checks both group-level ACL and message-level visibility.
 */
export async function canViewMessage(
  conversationId: string,
  userId: string,
  message: Message
): Promise<boolean> {
  // First check group-level read permission
  const groupAccess = await canViewMessages(conversationId, userId)
  if (!groupAccess) return false

  // Then check message-level visibility
  return isMessageVisibleToUser(message, userId)
}

/**
 * Filter messages with full access check (group + message level).
 * Use this when loading messages for a user who may or may not be a member.
 * For known members, prefer the simpler filterVisibleMessages.
 */
export async function filterAccessibleMessages(
  conversationId: string,
  userId: string,
  messages: Message[]
): Promise<Message[]> {
  // Check group-level access first (single check, not per message)
  const groupAccess = await canViewMessages(conversationId, userId)
  if (!groupAccess) return []

  // Then filter by message-level visibility
  return filterVisibleMessages(messages, userId)
}
