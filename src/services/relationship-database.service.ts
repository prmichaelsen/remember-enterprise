/**
 * RelationshipDatabaseService — server-side Firestore operations for relationships.
 * Matches agentbase.me's schema and query patterns exactly.
 *
 * Global collection: agentbase.relationships/{id}
 * Per-user index: agentbase.users/{userId}/relationship_index/{relatedUserId}
 */

import {
  getDocument,
  setDocument,
  deleteDocument,
  queryDocuments,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'

const BASE = 'agentbase'
const RELATIONSHIPS = `${BASE}.relationships`

function getUserRelationshipIndexCollection(userId: string): string {
  return `${BASE}.users/${userId}/relationship_index`
}

export interface RelationshipFlags {
  friend?: boolean
  pending_friend?: boolean
  blocked?: boolean
  muted?: boolean
  restricted?: boolean
  follower?: boolean
  following?: boolean
}

export interface Relationship {
  id: string
  user_id_1: string
  user_id_2: string
  initiated_by_user_id: string
  flags: RelationshipFlags
  friend_data?: { became_friends_at: string }
  blocked_data?: { blocked_by_user_id: string; blocked_at: string }
  notes: Record<string, string>
  created_at: string
  updated_at: string
}

export interface RelationshipIndexEntry {
  related_user_id: string
  relationship_id: string
  flags: RelationshipFlags
  updated_at: string
}

function generateRelationshipId(userId1: string, userId2: string): string {
  return userId1 < userId2 ? `${userId1}-${userId2}` : `${userId2}-${userId1}`
}

export class RelationshipDatabaseService {
  static async getRelationship(
    userId1: string,
    userId2: string,
  ): Promise<Relationship | null> {
    initFirebaseAdmin()
    const id = generateRelationshipId(userId1, userId2)

    try {
      const doc = await getDocument(RELATIONSHIPS, id)
      if (!doc) return null
      return doc as Relationship
    } catch (error) {
      console.error('[RelationshipDatabaseService] getRelationship failed:', error)
      return null
    }
  }

  static async createRelationship(
    currentUserId: string,
    relatedUserId: string,
    flags: RelationshipFlags,
  ): Promise<Relationship> {
    initFirebaseAdmin()
    const id = generateRelationshipId(currentUserId, relatedUserId)
    const [user1, user2] = currentUserId < relatedUserId
      ? [currentUserId, relatedUserId]
      : [relatedUserId, currentUserId]
    const now = new Date().toISOString()

    const relationship: Relationship = {
      id,
      user_id_1: user1,
      user_id_2: user2,
      initiated_by_user_id: currentUserId,
      flags,
      notes: {},
      created_at: now,
      updated_at: now,
    }

    await setDocument(RELATIONSHIPS, id, relationship)

    // Write per-user index entries (matches agentbase.me writeIndexEntries)
    await this.writeIndexEntries(currentUserId, relatedUserId, id, flags, now)

    return relationship
  }

  static async updateRelationship(
    currentUserId: string,
    relatedUserId: string,
    flagUpdates: Partial<RelationshipFlags>,
  ): Promise<Relationship | null> {
    initFirebaseAdmin()
    const existing = await this.getRelationship(currentUserId, relatedUserId)
    if (!existing) return null

    const now = new Date().toISOString()

    // Merge flags additively (matches agentbase.me)
    const mergedFlags: RelationshipFlags = {
      ...existing.flags,
      ...flagUpdates,
    }

    const updated: Relationship = {
      ...existing,
      flags: mergedFlags,
      updated_at: now,
    }

    await setDocument(RELATIONSHIPS, existing.id, updated)

    // Update both index entries
    await this.writeIndexEntries(
      existing.user_id_1,
      existing.user_id_2,
      existing.id,
      mergedFlags,
      now,
    )

    return updated
  }

  static async deleteRelationship(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    initFirebaseAdmin()
    const id = generateRelationshipId(userId1, userId2)

    try {
      await deleteDocument(RELATIONSHIPS, id)

      const index1 = getUserRelationshipIndexCollection(userId1)
      const index2 = getUserRelationshipIndexCollection(userId2)
      await deleteDocument(index1, userId2)
      await deleteDocument(index2, userId1)

      return true
    } catch (error) {
      console.error('[RelationshipDatabaseService] deleteRelationship failed:', error)
      return false
    }
  }

  /**
   * List relationships for a user, optionally filtered by flags.
   * Matches agentbase.me: fetch all index docs, filter in-memory.
   */
  static async listRelationships(
    userId: string,
    filters?: Partial<RelationshipFlags>,
  ): Promise<RelationshipIndexEntry[]> {
    initFirebaseAdmin()

    try {
      const collection = getUserRelationshipIndexCollection(userId)
      const docs = await queryDocuments(collection)
      if (!docs || !Array.isArray(docs)) return []

      const entries: RelationshipIndexEntry[] = []
      for (const entry of docs) {
        // queryDocuments returns { id, data } objects
        const doc = (entry as any).data ?? entry
        const parsed = doc as RelationshipIndexEntry
        if (!parsed.related_user_id && !parsed.flags) continue

        // Apply flag filters
        if (filters) {
          const flagMatch = Object.entries(filters).every(
            ([key, value]) => parsed.flags?.[key as keyof RelationshipFlags] === value,
          )
          if (!flagMatch) continue
        }

        entries.push(parsed)
      }

      return entries
    } catch (error) {
      console.error('[RelationshipDatabaseService] listRelationships failed:', error)
      return []
    }
  }

  /**
   * Write index entries for both users in a relationship.
   */
  private static async writeIndexEntries(
    userId1: string,
    userId2: string,
    relationshipId: string,
    flags: RelationshipFlags,
    updatedAt: string,
  ): Promise<void> {
    const index1 = getUserRelationshipIndexCollection(userId1)
    const index2 = getUserRelationshipIndexCollection(userId2)

    const entry1: RelationshipIndexEntry = {
      related_user_id: userId2,
      relationship_id: relationshipId,
      flags,
      updated_at: updatedAt,
    }

    const entry2: RelationshipIndexEntry = {
      related_user_id: userId1,
      relationship_id: relationshipId,
      flags,
      updated_at: updatedAt,
    }

    await setDocument(index1, userId2, entry1)
    await setDocument(index2, userId1, entry2)
  }
}
