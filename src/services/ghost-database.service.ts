/**
 * GhostDatabaseService — server-side Firestore CRUD for ghost persona conversations.
 * Collection path: users/{userId}/ghost_conversations
 *
 * Integrates with remember-core SvcClient for memory-augmented ghost responses.
 */

import {
  getDocument,
  setDocument,
  queryDocuments,
  addDocument,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import type { QueryOptions } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getRememberSvcClient } from '@/lib/remember-sdk'
import type {
  GhostPersona,
  GhostConversation,
  GhostMessage,
} from '@/services/ghost.service'

const GHOSTS_COLLECTION = 'agentbase.ghosts'

function ghostConversationsCollection(userId: string): string {
  return `agentbase.users/${userId}/ghost_conversations`
}

function ghostMessagesCollection(userId: string, conversationId: string): string {
  return `agentbase.users/${userId}/ghost_conversations/${conversationId}/messages`
}

export class GhostDatabaseService {
  /**
   * List available ghost personas for a user.
   */
  static async listGhosts(userId: string): Promise<GhostPersona[]> {
    initFirebaseAdmin()

    try {
      const docs = await queryDocuments(GHOSTS_COLLECTION, {
        limit: 100,
      })

      return docs.map((doc) => ({
        ...(doc.data as unknown as GhostPersona),
        id: doc.id,
      }))
    } catch (error) {
      console.error('[GhostDatabaseService] listGhosts failed:', error)
      return []
    }
  }

  /**
   * Get or create a conversation with a specific ghost.
   * If a conversation already exists for this user + ghost, returns it.
   */
  static async getOrCreateConversation(
    userId: string,
    ghostId: string,
  ): Promise<GhostConversation> {
    initFirebaseAdmin()
    const collection = ghostConversationsCollection(userId)

    // Check for existing conversation with this ghost
    try {
      const existing = await queryDocuments(collection, {
        where: [{ field: 'ghostId', op: '==', value: ghostId }],
        limit: 1,
      })

      if (existing.length > 0) {
        const doc = existing[0]
        return {
          ...(doc.data as unknown as GhostConversation),
          id: doc.id,
        }
      }
    } catch (error) {
      console.error('[GhostDatabaseService] query existing conversation failed:', error)
    }

    // Create new conversation
    const now = new Date().toISOString()

    // Fetch ghost name
    let ghostName = 'Ghost'
    try {
      const ghostDoc = await getDocument(GHOSTS_COLLECTION, ghostId)
      if (ghostDoc) {
        ghostName = (ghostDoc as unknown as GhostPersona).name ?? 'Ghost'
      }
    } catch {
      // Use default name
    }

    const conversationData = {
      ghostId,
      ghostName,
      userId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDocument(collection, conversationData)
    return { id: docRef.id, ...conversationData }
  }

  /**
   * Send a message in a ghost conversation.
   * Persists the message, then queries relevant memories via SvcClient for context.
   * Returns the stored message along with memory context for the ghost to reference.
   */
  static async sendMessage(
    userId: string,
    conversationId: string,
    message: { role: 'user' | 'assistant'; content: string },
  ): Promise<{ message: GhostMessage; memoryContext: unknown[] }> {
    initFirebaseAdmin()
    const collection = ghostMessagesCollection(userId, conversationId)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const ghostMessage: GhostMessage = {
      id,
      role: message.role,
      content: message.content,
      createdAt: now,
    }

    await setDocument(collection, id, ghostMessage)

    // Update conversation's updatedAt timestamp
    const convCollection = ghostConversationsCollection(userId)
    await setDocument(
      convCollection,
      conversationId,
      { updatedAt: now },
      { merge: true },
    )

    // Query relevant memories for context when the message is from the user
    let memoryContext: unknown[] = []
    if (message.role === 'user') {
      try {
        const svc = await getRememberSvcClient()
        const result = await svc.memories.search(userId, {
          query: message.content,
          limit: 5,
        })
        if (result.ok && result.data) {
          memoryContext = Array.isArray(result.data)
            ? result.data
            : (result.data as any).memories ?? []
        }
      } catch (error) {
        console.warn('[GhostDatabaseService] memory search failed, proceeding without context:', error)
      }
    }

    return { message: ghostMessage, memoryContext }
  }

  /**
   * List all ghost conversations for a user.
   */
  static async listConversations(userId: string): Promise<GhostConversation[]> {
    initFirebaseAdmin()
    const collection = ghostConversationsCollection(userId)

    try {
      const docs = await queryDocuments(collection, {
        orderBy: [{ field: 'updatedAt', direction: 'DESCENDING' }],
        limit: 100,
      })

      return docs.map((doc) => ({
        ...(doc.data as unknown as GhostConversation),
        id: doc.id,
      }))
    } catch (error) {
      console.error('[GhostDatabaseService] listConversations failed:', error)
      return []
    }
  }
}
