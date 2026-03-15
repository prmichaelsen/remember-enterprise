/**
 * Group Service — group creation, member management, ACL enforcement.
 * Firestore calls are stubbed; interface is fully defined.
 */

import type {
  Conversation,
  GroupMember,
  GroupPermissions,
  GroupAuthLevel,
  OWNER_PRESET,
  MEMBER_PRESET,
} from '@/types/conversations'
import { createConversation } from '@/services/conversation.service'

export interface CreateGroupParams {
  name: string
  description?: string
  created_by: string
  invited_user_ids?: string[]
  is_discoverable?: boolean
}

export interface UpdateGroupParams {
  name?: string
  description?: string
  is_discoverable?: boolean
}

/**
 * Create a new group conversation with the creator as OWNER.
 */
export async function createGroup(params: CreateGroupParams): Promise<{
  conversation: Conversation
  members: GroupMember[]
}> {
  const allParticipants = [
    params.created_by,
    ...(params.invited_user_ids ?? []),
  ]

  const conversation = await createConversation({
    type: 'group',
    participant_ids: allParticipants,
    name: params.name,
    description: params.description,
    created_by: params.created_by,
  })

  // Create owner member record
  const now = new Date().toISOString()
  const ownerMember: GroupMember = {
    user_id: params.created_by,
    display_name: '', // Resolved from user profile
    photo_url: null,
    auth_level: 0, // OWNER
    permissions: {
      can_read: true,
      can_publish: true,
      can_manage_members: true,
      can_moderate: true,
      can_kick: true,
      can_ban: true,
    },
    joined_at: now,
  }

  // Stub: Firestore write owner member
  // await setDoc(
  //   doc(db, 'conversations', conversation.id, 'members', params.created_by),
  //   ownerMember
  // )

  // Create member records for invited users
  const invitedMembers: GroupMember[] = (params.invited_user_ids ?? []).map(
    (userId) => ({
      user_id: userId,
      display_name: '',
      photo_url: null,
      auth_level: 5 as GroupAuthLevel, // MEMBER
      permissions: {
        can_read: true,
        can_publish: true,
        can_manage_members: false,
        can_moderate: false,
        can_kick: false,
        can_ban: false,
      },
      joined_at: now,
    })
  )

  // Stub: Firestore batch write invited members
  // const batch = writeBatch(db)
  // for (const member of invitedMembers) {
  //   batch.set(
  //     doc(db, 'conversations', conversation.id, 'members', member.user_id),
  //     member
  //   )
  // }
  // await batch.commit()

  return {
    conversation,
    members: [ownerMember, ...invitedMembers],
  }
}

/**
 * Update group metadata (name, description, discoverability).
 */
export async function updateGroup(
  conversationId: string,
  params: UpdateGroupParams
): Promise<void> {
  // Stub: Firestore update
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   ...params,
  //   updated_at: new Date().toISOString(),
  // })
  void conversationId
  void params
}

/**
 * List all members of a group.
 */
export async function listGroupMembers(
  conversationId: string
): Promise<GroupMember[]> {
  // Stub: Firestore query
  // const snap = await getDocs(
  //   collection(db, 'conversations', conversationId, 'members')
  // )
  // return snap.docs.map(d => d.data() as GroupMember)
  void conversationId
  return []
}

/**
 * Get a specific member's record.
 */
export async function getGroupMember(
  conversationId: string,
  userId: string
): Promise<GroupMember | null> {
  // Stub: Firestore read
  // const docSnap = await getDoc(
  //   doc(db, 'conversations', conversationId, 'members', userId)
  // )
  // return docSnap.exists() ? (docSnap.data() as GroupMember) : null
  void conversationId
  void userId
  return null
}

/**
 * Invite a user to a group (adds as MEMBER by default).
 */
export async function inviteMember(
  conversationId: string,
  userId: string,
  invitedBy: string
): Promise<GroupMember> {
  // ACL check: inviter must have can_manage_members
  const canManage = await checkPermission(conversationId, invitedBy, 'can_manage_members')
  if (!canManage) {
    throw new Error('Insufficient permissions: cannot manage members')
  }

  const now = new Date().toISOString()
  const member: GroupMember = {
    user_id: userId,
    display_name: '',
    photo_url: null,
    auth_level: 5, // MEMBER
    permissions: {
      can_read: true,
      can_publish: true,
      can_manage_members: false,
      can_moderate: false,
      can_kick: false,
      can_ban: false,
    },
    joined_at: now,
  }

  // Stub: Firestore write + update participant_ids
  // await setDoc(doc(db, 'conversations', conversationId, 'members', userId), member)
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   participant_ids: arrayUnion(userId),
  // })

  return member
}

/**
 * Remove a member from a group.
 */
export async function removeMember(
  conversationId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  // ACL check: remover must have can_kick
  const canKick = await checkPermission(conversationId, removedBy, 'can_kick')
  if (!canKick) {
    throw new Error('Insufficient permissions: cannot kick members')
  }

  // Cannot remove the owner
  const targetMember = await getGroupMember(conversationId, userId)
  if (targetMember?.auth_level === 0) {
    throw new Error('Cannot remove the group owner')
  }

  // Stub: Firestore delete + update participant_ids
  // await deleteDoc(doc(db, 'conversations', conversationId, 'members', userId))
  // await updateDoc(doc(db, 'conversations', conversationId), {
  //   participant_ids: arrayRemove(userId),
  // })
  void conversationId
  void userId
}

/**
 * Update a member's role and permissions.
 */
export async function updateMemberRole(
  conversationId: string,
  userId: string,
  authLevel: GroupAuthLevel,
  permissions: GroupPermissions,
  updatedBy: string
): Promise<void> {
  // ACL check: updater must have can_manage_members
  const canManage = await checkPermission(conversationId, updatedBy, 'can_manage_members')
  if (!canManage) {
    throw new Error('Insufficient permissions: cannot manage members')
  }

  // Cannot change owner's role (only owner transfer supported separately)
  const targetMember = await getGroupMember(conversationId, userId)
  if (targetMember?.auth_level === 0 && authLevel !== 0) {
    throw new Error('Cannot demote the group owner')
  }

  // Stub: Firestore update
  // await updateDoc(
  //   doc(db, 'conversations', conversationId, 'members', userId),
  //   { auth_level: authLevel, permissions }
  // )
  void conversationId
  void userId
  void authLevel
  void permissions
}

/**
 * Check if a user has a specific permission in a group.
 */
export async function checkPermission(
  conversationId: string,
  userId: string,
  permission: keyof GroupPermissions
): Promise<boolean> {
  const member = await getGroupMember(conversationId, userId)
  if (!member) return false
  return member.permissions[permission]
}

/**
 * Check if a user can read messages in a conversation.
 */
export async function canReadConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  return checkPermission(conversationId, userId, 'can_read')
}

/**
 * Check if a user can publish (send messages) in a conversation.
 */
export async function canPublish(
  conversationId: string,
  userId: string
): Promise<boolean> {
  return checkPermission(conversationId, userId, 'can_publish')
}
