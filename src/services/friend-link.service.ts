/**
 * FriendLinkService — generates and redeems shareable friend links.
 * Shared collection with agentbase.me: agentbase.friend-links/{code}
 */

import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { RelationshipDatabaseService } from './relationship-database.service'
import type { FriendLink } from '@/types/friend-link'

const FRIEND_LINKS = 'agentbase.friend-links'

interface GenerateOptions {
  expires_in_hours?: number
  max_uses?: number
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export class FriendLinkService {
  static async generateFriendLink(
    userId: string,
    options?: GenerateOptions,
  ): Promise<FriendLink> {
    initFirebaseAdmin()
    const code = generateCode()
    const now = new Date()

    const expiresAt = options?.expires_in_hours
      ? new Date(now.getTime() + options.expires_in_hours * 60 * 60 * 1000).toISOString()
      : null

    const link: FriendLink = {
      code,
      created_by_user_id: userId,
      url: `https://memorycloud.chat/friend-links/${code}`,
      expires_at: expiresAt,
      max_uses: options?.max_uses ?? null,
      use_count: 0,
      created_at: now.toISOString(),
    }

    await setDocument(FRIEND_LINKS, code, link)
    return link
  }

  static async redeemFriendLink(
    userId: string,
    code: string,
  ): Promise<{ relationship: any } | { error: string }> {
    initFirebaseAdmin()
    const doc = await getDocument(FRIEND_LINKS, code)
    if (!doc) {
      return { error: 'Friend link not found' }
    }

    const link = doc as unknown as FriendLink

    if (link.created_by_user_id === userId) {
      return { error: 'Cannot redeem your own friend link' }
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { error: 'Friend link has expired' }
    }

    if (link.max_uses !== null && link.use_count >= link.max_uses) {
      return { error: 'Friend link has reached maximum uses' }
    }

    const existing = await RelationshipDatabaseService.getRelationship(userId, link.created_by_user_id)
    if (existing) {
      return { error: 'You already have a relationship with this user' }
    }

    const relationship = await RelationshipDatabaseService.createRelationship(
      userId,
      link.created_by_user_id,
      { pending_friend: true },
    )

    await setDocument(FRIEND_LINKS, code, {
      ...link,
      use_count: link.use_count + 1,
    })

    return { relationship }
  }
}
