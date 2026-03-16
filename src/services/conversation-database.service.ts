/**
 * ConversationDatabaseService — server-side Firestore operations.
 * Queries agentbase.me's shared Firestore for conversations.
 *
 * Collection paths (shared with agentbase.me):
 *   User solo chats: agentbase.users/{userId}/conversations/{conversationId}
 *   DMs & groups:    agentbase.conversations/{conversationId}
 *   Messages:        .../{conversationId}/messages/{messageId}
 */

import {
  queryDocuments,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { createLogger } from '@/lib/logger'
import type { ConversationType } from '@/types/conversations'

const log = createLogger('ConversationDatabaseService')

const BASE = 'agentbase'

function getUserConversations(userId: string) {
  return `${BASE}.users/${userId}/conversations`
}

function getSharedConversations() {
  return `${BASE}.conversations`
}

function getConversationMessages(conversationId: string, shared: boolean, userId?: string) {
  if (shared) {
    return `${BASE}.conversations/${conversationId}/messages`
  }
  return `${BASE}.users/${userId}/conversations/${conversationId}/messages`
}

export interface ConversationDoc {
  id: string
  type: 'chat' | 'dm' | 'group' | 'ghost'
  title?: string
  name?: string
  description?: string | null
  participant_user_ids?: string[]
  owner_user_id?: string
  is_dm?: boolean
  last_message_at?: string | null
  last_message_preview?: string | null
  message_count?: number
  archived?: boolean
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export class ConversationDatabaseService {
  /** Safely extract a plain ConversationDoc from a queryDocuments result. */
  private static docToConversation(doc: any): ConversationDoc {
    return JSON.parse(JSON.stringify({ ...(doc.data ?? {}), id: doc.id }))
  }

  /**
   * Get all conversations for a user — solo chats from user-scoped collection.
   */
  static async getUserConversations(
    userId: string,
    limit = 50,
  ): Promise<ConversationDoc[]> {
    try {
      const path = getUserConversations(userId)
      const results = await queryDocuments(path, {
        orderBy: [{ field: 'updated_at', direction: 'DESCENDING' }],
        limit,
      })
      return (results ?? []).map(this.docToConversation)
    } catch (error) {
      log.error({ err: error }, 'getUserConversations failed')
      return []
    }
  }

  /**
   * Get DM conversations where user is a participant.
   */
  static async getUserDMs(userId: string, limit = 50): Promise<ConversationDoc[]> {
    try {
      const path = getSharedConversations()
      const results = await queryDocuments(path, {
        where: [
          { field: 'participant_user_ids', op: 'array-contains', value: userId },
          { field: 'is_dm', op: '==', value: true },
        ],
        orderBy: [{ field: 'last_message_at', direction: 'DESCENDING' }],
        limit,
      })
      return (results ?? []).map(this.docToConversation)
    } catch (error) {
      log.error({ err: error }, 'getUserDMs failed')
      return []
    }
  }

  /**
   * Get group conversations where user is a participant.
   */
  static async getUserGroups(userId: string, limit = 50): Promise<ConversationDoc[]> {
    try {
      const path = getSharedConversations()
      const results = await queryDocuments(path, {
        where: [
          { field: 'participant_user_ids', op: 'array-contains', value: userId },
          { field: 'type', op: '==', value: 'group' },
        ],
        orderBy: [{ field: 'last_message_at', direction: 'DESCENDING' }],
        limit,
      })
      return (results ?? []).map(this.docToConversation)
    } catch (error) {
      log.error({ err: error }, 'getUserGroups failed')
      return []
    }
  }

  /**
   * Get ALL conversations for a user (solo + DMs + groups), merged and sorted.
   */
  static async getAllConversations(
    userId: string,
    limit = 50,
  ): Promise<ConversationDoc[]> {
    const [solo, dms, groups] = await Promise.all([
      this.getUserConversations(userId, limit),
      this.getUserDMs(userId, limit),
      this.getUserGroups(userId, limit),
    ])

    const all = [...solo, ...dms, ...groups]

    // Sort by most recent activity
    all.sort((a, b) => {
      const aTime = a.last_message_at ?? a.updated_at ?? a.created_at ?? ''
      const bTime = b.last_message_at ?? b.updated_at ?? b.created_at ?? ''
      return bTime.localeCompare(aTime)
    })

    return all.slice(0, limit)
  }

  /**
   * List conversations — convenience wrapper.
   */
  static async listConversations(
    params: { user_id: string; limit?: number },
  ): Promise<{ conversations: ConversationDoc[] }> {
    const conversations = await this.getAllConversations(params.user_id, params.limit ?? 50)
    return { conversations }
  }

  /**
   * Find an existing DM between two participants (returns raw doc or null).
   */
  static async findDmByParticipants(userA: string, userB: string): Promise<ConversationDoc | null> {
    try {
      const path = getSharedConversations()
      const results = await queryDocuments(path, {
        where: [
          { field: 'participant_user_ids', op: 'array-contains', value: userA },
          { field: 'is_dm', op: '==', value: true },
        ],
        limit: 50,
      })
      const match = results?.find((doc: any) => doc.data?.participant_user_ids?.includes(userB))
      if (!match) return null
      return this.docToConversation(match)
    } catch (error) {
      log.error({ err: error }, 'findDmByParticipants failed')
      return null
    }
  }

  /**
   * Get a single conversation by ID (tries shared first, then user-scoped).
   */
  static async getConversation(
    conversationId: string,
    userId?: string,
  ): Promise<ConversationDoc | null> {
    try {
      // Try shared collection first (DM/group)
      const shared = await getDocument(
        getSharedConversations(),
        conversationId,
      )
      if (shared) return { id: conversationId, ...shared } as ConversationDoc

      // Fall back to user-scoped (solo chat)
      if (userId) {
        const userDoc = await getDocument(
          getUserConversations(userId),
          conversationId,
        )
        if (userDoc) return { id: conversationId, ...userDoc } as ConversationDoc
      }

      return null
    } catch (error) {
      log.error({ err: error }, 'getConversation failed')
      return null
    }
  }

  /**
   * Create a new conversation (DM or group) in the shared collection.
   */
  static async createConversation(input: {
    type: ConversationDoc['type']
    participant_user_ids: string[]
    title?: string
    created_by: string
  }): Promise<ConversationDoc> {
    initFirebaseAdmin()
    const path = getSharedConversations()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const doc: ConversationDoc = {
      id,
      type: input.type,
      title: input.title,
      participant_user_ids: input.participant_user_ids,
      owner_user_id: input.created_by,
      is_dm: input.type === 'dm',
      last_message_at: null,
      last_message_preview: null,
      message_count: 0,
      created_at: now,
      updated_at: now,
    }

    await setDocument(path, id, doc)
    return doc
  }

  /**
   * Update the last message preview on a conversation document.
   * Uses type-based routing (matches agentbase.me — no extra Firestore lookups).
   */
  static async updateLastMessage(
    conversationId: string,
    preview: { content: string; sender_user_id: string; timestamp: string },
    userId?: string,
    conversationType?: ConversationType,
  ): Promise<void> {
    initFirebaseAdmin()
    const update = {
      last_message_at: preview.timestamp,
      last_message_preview: preview.content,
      updated_at: new Date().toISOString(),
    }

    if (conversationType === 'dm' || conversationType === 'group') {
      await updateDocument(getSharedConversations(), conversationId, update)
    } else if (userId) {
      await updateDocument(getUserConversations(userId), conversationId, update)
    } else {
      // Fallback: try shared
      await updateDocument(getSharedConversations(), conversationId, update)
    }
  }

  /**
   * Get messages for a conversation.
   */
  static async getMessages(
    conversationId: string,
    options: { userId?: string; shared?: boolean; limit?: number } = {},
  ) {
    const { userId, shared = true, limit = 50 } = options
    try {
      const path = getConversationMessages(conversationId, shared, userId)
      const results = await queryDocuments(path, {
        orderBy: [{ field: 'timestamp', direction: 'ASCENDING' }],
        limit,
      })
      return results ?? []
    } catch (error) {
      log.error({ err: error }, 'getMessages failed')
      return []
    }
  }

  /**
   * Add a participant to a shared conversation.
   */
  static async addParticipant(conversationId: string, userId: string): Promise<void> {
    initFirebaseAdmin()
    const path = getSharedConversations()
    const doc = await getDocument(path, conversationId) as any
    if (!doc) throw new Error('Conversation not found')
    const participants: string[] = doc.participant_user_ids ?? []
    if (!participants.includes(userId)) {
      participants.push(userId)
      await updateDocument(path, conversationId, {
        participant_user_ids: participants,
        updated_at: new Date().toISOString(),
      })
    }
  }

  /**
   * Remove a participant from a shared conversation.
   */
  static async removeParticipant(conversationId: string, userId: string): Promise<void> {
    initFirebaseAdmin()
    const path = getSharedConversations()
    const doc = await getDocument(path, conversationId) as any
    if (!doc) throw new Error('Conversation not found')
    const participants: string[] = (doc.participant_user_ids ?? []).filter((id: string) => id !== userId)
    await updateDocument(path, conversationId, {
      participant_user_ids: participants,
      updated_at: new Date().toISOString(),
    })
  }

  /**
   * Delete a conversation from the shared collection.
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    initFirebaseAdmin()
    const path = getSharedConversations()
    await deleteDocument(path, conversationId)
  }
}
