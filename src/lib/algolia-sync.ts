/**
 * Fire-and-forget Algolia sync helpers.
 * Called from API routes after successful writes to keep agentbase indices fresh.
 * All functions catch errors silently — search indexing must never block the write path.
 */

import { getAlgoliaClient, MESSAGES_INDEX, CONVERSATIONS_INDEX } from '@/lib/algolia'
import { createLogger } from '@/lib/logger'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import type { Message } from '@/types/conversations'
import type { ConversationDoc } from '@/services/conversation-database.service'
import { getTextContent } from '@/lib/message-content'

const log = createLogger('algolia-sync')

/**
 * Index a newly sent message to Algolia.
 * Must be awaited — Cloudflare terminates execution after response is sent.
 */
export async function syncMessageToAlgolia(
  message: Message,
  participantIds: string[],
  senderName: string,
): Promise<void> {
  try {
    const client = getAlgoliaClient()
    await client.saveObject({
      indexName: MESSAGES_INDEX,
      body: {
        objectID: message.id,
        content: getTextContent(message.content),
        conversation_id: message.conversation_id,
        sender_display_name: senderName,
        role: 'user',
        timestamp: message.timestamp,
        searchable_by: participantIds.map((id) => `user:${id}`),
      },
    })
  } catch (err) {
    log.error({ err }, 'failed to index message')
  }
}

/**
 * Index a newly created conversation to Algolia.
 * Must be awaited — Cloudflare terminates execution after response is sent.
 */
export async function syncConversationToAlgolia(conv: ConversationDoc): Promise<void> {
  try {
    const client = getAlgoliaClient()
    await client.saveObject({
      indexName: CONVERSATIONS_INDEX,
      body: {
        objectID: conv.id,
        title: conv.title ?? conv.name ?? 'Untitled',
        last_message_preview: '',
        owner_id: conv.owner_user_id,
        type: conv.type,
        is_archived: false,
        updated_at: conv.updated_at,
      },
    })
  } catch (err) {
    log.error({ err }, 'failed to index conversation')
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
