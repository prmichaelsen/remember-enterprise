/**
 * Fire-and-forget Algolia sync helpers.
 * Called from API routes after successful writes to keep the search index fresh.
 * All functions catch errors silently — search indexing must never block the write path.
 */

import {
  indexDocument,
  buildMessageDoc,
  buildGroupDoc,
  buildDmPartnerDoc,
} from '@/services/search.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import type { Message } from '@/types/conversations'
import type { ConversationDoc } from '@/services/conversation-database.service'

/**
 * Index a newly sent message to Algolia (fire-and-forget).
 * Needs the conversation's participant_ids to scope search visibility.
 */
export function syncMessageToAlgolia(
  message: Message,
  participantIds: string[],
) {
  indexDocument(
    buildMessageDoc({
      id: message.id,
      conversationId: message.conversation_id,
      content: message.content,
      senderName: message.sender_name,
      participantIds,
      createdAt: message.created_at,
    }),
  ).catch((err) => {
    console.error('[algolia-sync] Failed to index message:', err)
  })
}

/**
 * Index a newly created conversation to Algolia (fire-and-forget).
 * For groups: indexes the group itself.
 * For DMs: indexes each participant as a DM partner for the other.
 */
export function syncConversationToAlgolia(conv: ConversationDoc) {
  const participantIds = conv.participant_user_ids ?? []

  if (conv.type === 'group') {
    indexDocument(
      buildGroupDoc({
        id: conv.id,
        name: conv.name,
        description: conv.description,
        participantIds,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      }),
    ).catch((err) => {
      console.error('[algolia-sync] Failed to index group:', err)
    })
  } else {
    // DM — index each user as a DM partner for the other
    for (const userId of participantIds) {
      const otherIds = participantIds.filter((id) => id !== userId)
      for (const otherId of otherIds) {
        indexDocument(
          buildDmPartnerDoc({
            uid: otherId,
            conversationId: conv.id,
            participantIds,
          }),
        ).catch((err) => {
          console.error('[algolia-sync] Failed to index DM partner:', err)
        })
      }
    }
  }
}

/**
 * Look up a conversation's participant_ids for message indexing.
 * Returns empty array on failure (message still gets sent, just not indexed).
 */
export async function getParticipantIds(
  conversationId: string,
  userId: string,
): Promise<string[]> {
  try {
    const conv = await ConversationDatabaseService.getConversation(
      conversationId,
      userId,
    )
    return conv?.participant_user_ids ?? []
  } catch {
    return []
  }
}
