/**
 * Group Service — client-side API wrappers for group operations.
 * Server-side Firestore logic and ACL enforcement live in group-database.service.ts.
 */

import type {
  Conversation,
  GroupMember,
  GroupPermissions,
  GroupAuthLevel,
} from '@/types/conversations'

export interface CreateGroupParams {
  name: string
  description?: string
  invited_user_ids?: string[]
}

export interface UpdateGroupParams {
  name?: string
  description?: string
  is_discoverable?: boolean
}

/**
 * Create a new group conversation with the current user as OWNER.
 */
export async function createGroup(params: CreateGroupParams): Promise<{
  conversation: Conversation
  members: GroupMember[]
}> {
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to create group (${res.status})`)
  }
  return res.json()
}

/**
 * Update group metadata (name, description, discoverability).
 */
export async function updateGroup(
  conversationId: string,
  params: UpdateGroupParams,
): Promise<void> {
  const res = await fetch(`/api/groups/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    throw new Error(`Failed to update group (${res.status})`)
  }
}

/**
 * List all members of a group.
 */
export async function listGroupMembers(
  conversationId: string,
): Promise<GroupMember[]> {
  const res = await fetch(`/api/groups/${conversationId}/members`)
  if (!res.ok) {
    throw new Error(`Failed to list group members (${res.status})`)
  }
  const data = await res.json()
  return data.members ?? []
}

/**
 * Get a specific member's record.
 */
export async function getGroupMember(
  conversationId: string,
  userId: string,
): Promise<GroupMember | null> {
  const res = await fetch(`/api/groups/${conversationId}/members/${userId}`)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to get group member (${res.status})`)
  }
  return res.json()
}

/**
 * Invite a user to a group.
 */
export async function inviteMember(
  conversationId: string,
  userId: string,
): Promise<GroupMember> {
  const res = await fetch(`/api/groups/${conversationId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to invite member (${res.status})`)
  }
  return res.json()
}

/**
 * Remove a member from a group.
 */
export async function removeMember(
  conversationId: string,
  userId: string,
): Promise<void> {
  const res = await fetch(`/api/groups/${conversationId}/members/${userId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to remove member (${res.status})`)
  }
}

/**
 * Update a member's role and permissions.
 */
export async function updateMemberRole(
  conversationId: string,
  userId: string,
  authLevel: GroupAuthLevel,
  permissions: GroupPermissions,
): Promise<void> {
  const res = await fetch(`/api/groups/${conversationId}/members/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_level: authLevel, permissions }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Failed to update member role (${res.status})`)
  }
}

/**
 * Check if a user has a specific permission in a group.
 */
export async function checkPermission(
  conversationId: string,
  userId: string,
  permission: keyof GroupPermissions,
): Promise<boolean> {
  const res = await fetch(
    `/api/groups/${conversationId}/permissions/${permission}?user_id=${encodeURIComponent(userId)}`,
  )
  if (!res.ok) return false
  const data = await res.json()
  return data.allowed ?? false
}

/**
 * Check if the current user can read a conversation.
 */
export async function canReadConversation(
  conversationId: string,
): Promise<boolean> {
  const res = await fetch(`/api/groups/${conversationId}/permissions/can_read`)
  if (!res.ok) return false
  const data = await res.json()
  return data.allowed ?? false
}

/**
 * Check if the current user can publish in a conversation.
 */
export async function canPublish(
  conversationId: string,
): Promise<boolean> {
  const res = await fetch(`/api/groups/${conversationId}/permissions/can_publish`)
  if (!res.ok) return false
  const data = await res.json()
  return data.allowed ?? false
}
