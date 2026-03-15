/**
 * DmLinkService — generates and redeems one-time-use DM invite links.
 * Shared collection with agentbase.me: agentbase.dm-links/{code}
 */

import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { ConversationDatabaseService } from './conversation-database.service'
import type { DmLink } from '@/types/dm-link'

const DM_LINKS = 'agentbase.dm-links'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export class DmLinkService {
  static async generateDmLink(userId: string): Promise<DmLink> {
    initFirebaseAdmin()
    const code = generateCode()
    const now = new Date()

    const link: DmLink = {
      code,
      created_by_user_id: userId,
      url: `https://memorycloud.chat/dm-links/${code}`,
      max_uses: 1,
      use_count: 0,
      created_at: now.toISOString(),
    }

    await setDocument(DM_LINKS, code, link)
    return link
  }

  static async redeemDmLink(
    userId: string,
    code: string,
  ): Promise<{ conversation_id: string; partner_user_id: string } | { error: string }> {
    initFirebaseAdmin()
    const doc = await getDocument(DM_LINKS, code)
    if (!doc) {
      return { error: 'DM link not found' }
    }

    const link = doc as unknown as DmLink

    if (link.created_by_user_id === userId) {
      return { error: 'Cannot redeem your own DM link' }
    }

    if (link.use_count >= link.max_uses) {
      return { error: 'DM link has already been used' }
    }

    // Find existing DM or create one
    const conversation = await ConversationDatabaseService.createConversation({
      type: 'dm',
      participant_user_ids: [userId, link.created_by_user_id],
      created_by: userId,
    })

    await setDocument(DM_LINKS, code, {
      ...link,
      use_count: link.use_count + 1,
    })

    return {
      conversation_id: conversation.id,
      partner_user_id: link.created_by_user_id,
    }
  }
}
