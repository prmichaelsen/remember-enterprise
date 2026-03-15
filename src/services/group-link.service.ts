/**
 * GroupLinkService — generates and redeems shareable group invite links.
 * Shared collection with agentbase.me: agentbase.group-links/{code}
 */

import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { GroupDatabaseService } from './group-database.service'
import { MEMBER_PRESET } from '@/types/conversations'
import type { GroupLink } from '@/types/group-link'
import type { GroupMember, GroupAuthLevel } from '@/types/conversations'

const GROUP_LINKS = 'agentbase.group-links'

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

export class GroupLinkService {
  static async generateGroupLink(
    userId: string,
    groupId: string,
    options?: GenerateOptions,
  ): Promise<GroupLink> {
    initFirebaseAdmin()
    const code = generateCode()
    const now = new Date()

    const expiresAt = options?.expires_in_hours
      ? new Date(now.getTime() + options.expires_in_hours * 60 * 60 * 1000).toISOString()
      : null

    const link: GroupLink = {
      code,
      group_id: groupId,
      created_by_user_id: userId,
      url: `https://memorycloud.chat/group-links/${code}`,
      expires_at: expiresAt,
      max_uses: options?.max_uses ?? null,
      use_count: 0,
      created_at: now.toISOString(),
    }

    await setDocument(GROUP_LINKS, code, link)
    return link
  }

  static async redeemGroupLink(
    userId: string,
    code: string,
  ): Promise<{ group_id: string } | { error: string }> {
    initFirebaseAdmin()
    const doc = await getDocument(GROUP_LINKS, code)
    if (!doc) {
      return { error: 'Group invite link not found' }
    }

    const link = doc as unknown as GroupLink

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { error: 'Group invite link has expired' }
    }

    if (link.max_uses !== null && link.use_count >= link.max_uses) {
      return { error: 'Group invite link has reached maximum uses' }
    }

    const group = await GroupDatabaseService.getGroup(link.group_id)
    if (!group) {
      return { error: 'Group no longer exists' }
    }

    // Check if already a member via the members subcollection
    const members = await GroupDatabaseService.listMembers(link.group_id)
    if (members.some((m) => m.user_id === userId)) {
      return { error: 'You are already a member of this group' }
    }

    const now = new Date().toISOString()
    const member: GroupMember = {
      user_id: userId,
      display_name: '',
      photo_url: null,
      auth_level: 5 as GroupAuthLevel,
      permissions: { ...MEMBER_PRESET },
      joined_at: now,
    }

    await GroupDatabaseService.addMember(link.group_id, member)

    await setDocument(GROUP_LINKS, code, {
      ...link,
      use_count: link.use_count + 1,
    })

    return { group_id: link.group_id }
  }
}
