/**
 * GroupDatabaseService — server-side Firestore CRUD for groups and group members.
 * Collection paths: groups/{groupId}, groups/{groupId}/members
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
import type {
  GroupMember,
  GroupPermissions,
  GroupAuthLevel,
} from '@/types/conversations'
import { OWNER_PRESET, MEMBER_PRESET } from '@/types/conversations'

const GROUPS_COLLECTION = 'groups'

function groupDoc(groupId: string): string {
  return GROUPS_COLLECTION
}

function membersCollection(groupId: string): string {
  return `groups/${groupId}/members`
}

export interface CreateGroupInput {
  name: string
  description?: string
  created_by: string
  invited_user_ids?: string[]
  is_discoverable?: boolean
}

export interface GroupRecord {
  id: string
  name: string
  description: string | null
  created_by: string
  is_discoverable: boolean
  created_at: string
  updated_at: string
}

export class GroupDatabaseService {
  /**
   * Create a new group with the creator as OWNER.
   */
  static async createGroup(data: CreateGroupInput): Promise<{
    group: GroupRecord
    members: GroupMember[]
  }> {
    initFirebaseAdmin()
    const now = new Date().toISOString()

    const groupData = {
      name: data.name,
      description: data.description ?? null,
      created_by: data.created_by,
      is_discoverable: data.is_discoverable ?? false,
      created_at: now,
      updated_at: now,
    }

    const docRef = await addDocument(GROUPS_COLLECTION, groupData)
    const groupId = docRef.id
    const group: GroupRecord = { id: groupId, ...groupData }

    // Create owner member
    const ownerMember: GroupMember = {
      user_id: data.created_by,
      display_name: '',
      photo_url: null,
      auth_level: 0,
      permissions: { ...OWNER_PRESET },
      joined_at: now,
    }

    const collection = membersCollection(groupId)
    await setDocument(collection, data.created_by, ownerMember)

    // Create invited members
    const invitedMembers: GroupMember[] = []
    for (const userId of data.invited_user_ids ?? []) {
      const member: GroupMember = {
        user_id: userId,
        display_name: '',
        photo_url: null,
        auth_level: 5 as GroupAuthLevel,
        permissions: { ...MEMBER_PRESET },
        joined_at: now,
      }
      await setDocument(collection, userId, member)
      invitedMembers.push(member)
    }

    return { group, members: [ownerMember, ...invitedMembers] }
  }

  /**
   * Get a group by ID.
   */
  static async getGroup(groupId: string): Promise<GroupRecord | null> {
    initFirebaseAdmin()

    try {
      const doc = await getDocument(GROUPS_COLLECTION, groupId)
      if (!doc) return null
      return { ...(doc as unknown as Omit<GroupRecord, 'id'>), id: groupId }
    } catch (error) {
      console.error('[GroupDatabaseService] getGroup failed:', error)
      return null
    }
  }

  /**
   * List all members of a group.
   */
  static async listMembers(groupId: string): Promise<GroupMember[]> {
    initFirebaseAdmin()
    const collection = membersCollection(groupId)

    try {
      const docs = await queryDocuments(collection, {
        orderBy: [{ field: 'joined_at', direction: 'ASCENDING' }],
        limit: 500,
      })

      return docs.map((doc) => ({
        ...(doc.data as unknown as GroupMember),
        user_id: doc.id,
      }))
    } catch (error) {
      console.error('[GroupDatabaseService] listMembers failed:', error)
      return []
    }
  }

  /**
   * Add a member to a group.
   */
  static async addMember(
    groupId: string,
    member: GroupMember,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = membersCollection(groupId)
    await setDocument(collection, member.user_id, member)
  }

  /**
   * Remove a member from a group.
   */
  static async removeMember(
    groupId: string,
    userId: string,
  ): Promise<void> {
    initFirebaseAdmin()
    const collection = membersCollection(groupId)
    await deleteDocument(collection, userId)
  }

  /**
   * Update group metadata (name, description, discoverability).
   */
  static async updateGroup(
    groupId: string,
    updates: Partial<Pick<GroupRecord, 'name' | 'description' | 'is_discoverable'>>,
  ): Promise<void> {
    initFirebaseAdmin()
    const now = new Date().toISOString()

    await setDocument(
      GROUPS_COLLECTION,
      groupId,
      { ...updates, updated_at: now },
      { merge: true },
    )
  }

  /**
   * Check if a user has a specific permission in a group.
   */
  static async checkPermission(
    groupId: string,
    userId: string,
    permission: keyof GroupPermissions,
  ): Promise<boolean> {
    initFirebaseAdmin()
    const collection = membersCollection(groupId)

    try {
      const doc = await getDocument(collection, userId)
      if (!doc) return false
      const member = doc as unknown as GroupMember
      return member.permissions?.[permission] ?? false
    } catch (error) {
      console.error('[GroupDatabaseService] checkPermission failed:', error)
      return false
    }
  }
}
