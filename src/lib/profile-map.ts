/**
 * Profile Map Builder
 *
 * Batch-fetches user profiles for API response enrichment.
 * Matches agentbase.me's maps.profiles pattern.
 */

import { getAllByPaths } from '@prmichaelsen/firebase-admin-sdk-v8'

const BASE = 'agentbase'

function getUserProfileCollection(userId: string): string {
  return `${BASE}.users/${userId}/profile`
}

export interface ProfileSummary {
  user_id: string
  display_name: string
  username: string | null
  profile_picture_path: string | null
}

export async function buildProfileMap(
  userIds: string[],
): Promise<Record<string, ProfileSummary>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return {}

  const refs = unique.map((uid) => ({
    collection: getUserProfileCollection(uid),
    id: 'default',
  }))

  const results = await getAllByPaths(refs)

  const map: Record<string, ProfileSummary> = {}
  for (let i = 0; i < unique.length; i++) {
    const raw = results[i] as any
    if (raw) {
      map[unique[i]] = {
        user_id: unique[i],
        display_name: raw.display_name ?? unique[i],
        username: raw.username ?? null,
        profile_picture_path: raw.profile_picture_path ?? null,
      }
    }
  }
  return map
}
