/**
 * RelationshipDatabaseService — server-side Firestore operations for relationships.
 * Shared collection with agentbase.me: agentbase.relationships/{id}
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

function userRelationshipIndex(userId: string): string {
  return `${BASE}.users/${userId}/relationship_index`
}

export interface Relationship {
  id: string
  user_id_1: string
  user_id_2: string
  friend?: boolean
  pending_friend?: boolean
  blocked?: boolean
  muted?: boolean
  initiated_by?: string
  created_at: string
  updated_at: string
}

export type RelationshipFlags = Pick<
  Relationship,
  'friend' | 'pending_friend' | 'blocked' | 'muted'
>

function makeRelationshipId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-')
}

export class RelationshipDatabaseService {
  static async getRelationship(
    userId1: string,
    userId2: string,
  ): Promise<Relationship | null> {
    initFirebaseAdmin()
    const id = makeRelationshipId(userId1, userId2)

    try {
      const doc = await getDocument(RELATIONSHIPS, id)
      if (!doc) return null
      return { id, ...(doc as any) } as Relationship
    } catch (error) {
      console.error('[RelationshipDatabaseService] getRelationship failed:', error)
      return null
    }
  }

  static async createRelationship(
    userId1: string,
    userId2: string,
    flags: RelationshipFlags & { initiated_by?: string },
  ): Promise<Relationship> {
    initFirebaseAdmin()
    const id = makeRelationshipId(userId1, userId2)
    const now = new Date().toISOString()

    const relationship: Relationship = {
      id,
      user_id_1: userId1,
      user_id_2: userId2,
      ...flags,
      created_at: now,
      updated_at: now,
    }

    await setDocument(RELATIONSHIPS, id, relationship)

    // Write per-user indices for fast queries
    const indexData1 = { related_user_id: userId2, ...flags, updated_at: now }
    const indexData2 = { related_user_id: userId1, ...flags, updated_at: now }
    await Promise.all([
      setDocument(userRelationshipIndex(userId1), userId2, indexData1),
      setDocument(userRelationshipIndex(userId2), userId1, indexData2),
    ])

    return relationship
  }

  static async updateRelationship(
    userId1: string,
    userId2: string,
    flags: Partial<RelationshipFlags>,
  ): Promise<Relationship | null> {
    initFirebaseAdmin()
    const id = makeRelationshipId(userId1, userId2)
    const now = new Date().toISOString()

    const existing = await this.getRelationship(userId1, userId2)
    if (!existing) return null

    const updated: Relationship = {
      ...existing,
      ...flags,
      updated_at: now,
    }

    await setDocument(RELATIONSHIPS, id, updated)

    // Update per-user indices
    const indexFlags = { ...flags, updated_at: now }
    await Promise.all([
      setDocument(userRelationshipIndex(userId1), userId2, indexFlags, { merge: true }),
      setDocument(userRelationshipIndex(userId2), userId1, indexFlags, { merge: true }),
    ])

    return updated
  }

  static async deleteRelationship(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    initFirebaseAdmin()
    const id = makeRelationshipId(userId1, userId2)

    try {
      await deleteDocument(RELATIONSHIPS, id)
      await Promise.all([
        deleteDocument(userRelationshipIndex(userId1), userId2),
        deleteDocument(userRelationshipIndex(userId2), userId1),
      ])
      return true
    } catch (error) {
      console.error('[RelationshipDatabaseService] deleteRelationship failed:', error)
      return false
    }
  }

  /**
   * List relationships for a user, optionally filtered by flag.
   */
  static async listRelationships(
    userId: string,
    filter?: { flag: keyof RelationshipFlags; value: boolean },
    limit = 50,
  ): Promise<Relationship[]> {
    initFirebaseAdmin()

    try {
      const where: any[] = [
        // Query global collection for relationships involving this user
      ]

      // Query by user_id_1 OR user_id_2 — Firestore doesn't support OR,
      // so query the per-user index instead
      const indexPath = userRelationshipIndex(userId)
      const queryOpts: any = {
        orderBy: [{ field: 'updated_at', direction: 'DESCENDING' }],
        limit,
      }

      if (filter) {
        queryOpts.where = [
          { field: filter.flag, op: '==', value: filter.value },
        ]
      }

      const docs = await queryDocuments(indexPath, queryOpts)
      if (!docs || docs.length === 0) return []

      // Fetch full relationship docs
      const relationships: Relationship[] = []
      for (const doc of docs) {
        const relatedUserId = (doc as any).related_user_id ?? doc.id
        const full = await this.getRelationship(userId, relatedUserId)
        if (full) relationships.push(full)
      }

      return relationships
    } catch (error) {
      console.error('[RelationshipDatabaseService] listRelationships failed:', error)
      return []
    }
  }
}
