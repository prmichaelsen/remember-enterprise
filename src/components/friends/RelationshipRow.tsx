/**
 * RelationshipRow — list item for a relationship with contextual action buttons.
 * Shows Accept/Decline for pending requests, Unblock for blocked users.
 */

import { useState } from 'react'
import { UserCheck, UserX, ShieldOff, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import type { RelationshipIndexEntry } from '@/services/relationship-database.service'
import type { ProfileSummary } from '@/lib/profile-map'

interface RelationshipRowProps {
  relationship: RelationshipIndexEntry
  profile?: ProfileSummary
  currentUserId: string
  onUpdate?: () => void
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function RelationshipRow({ relationship, profile, currentUserId, onUpdate }: RelationshipRowProps) {
  const t = useTheme()
  const [loading, setLoading] = useState<string | null>(null)
  const otherUserId = relationship.related_user_id

  const displayName = profile?.display_name ?? otherUserId.slice(0, 12) + '...'
  const username = profile?.username
  const initial = (profile?.display_name ?? otherUserId).charAt(0).toUpperCase()

  const isPending = relationship.flags.pending_friend && !relationship.flags.friend
  const isBlocked = relationship.flags.blocked

  async function patchRelationship(flags: Record<string, boolean>) {
    setLoading(Object.keys(flags)[0])
    try {
      const res = await fetch(`/api/relationships/${otherUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags }),
      })
      if (res.ok) onUpdate?.()
    } catch (error) {
      console.error('[RelationshipRow] action failed:', error)
    } finally {
      setLoading(null)
    }
  }

  async function deleteRelationship() {
    setLoading('delete')
    try {
      const res = await fetch(`/api/relationships/${otherUserId}`, { method: 'DELETE' })
      if (res.ok) onUpdate?.()
    } catch (error) {
      console.error('[RelationshipRow] delete failed:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${t.hover} transition-colors`}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
        <span className="text-white text-sm font-medium">{initial}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${t.textPrimary} truncate`}>
          {displayName}
        </div>
        <div className={`text-xs ${t.textMuted} truncate`}>
          {username ? `@${username}` : formatRelativeTime(relationship.updated_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {isPending && (
          <>
            <button
              type="button"
              onClick={() => patchRelationship({ friend: true, pending_friend: false })}
              disabled={loading !== null}
              className="p-1.5 rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors disabled:opacity-50"
              title="Accept"
            >
              {loading === 'friend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={deleteRelationship}
              disabled={loading !== null}
              className="p-1.5 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
              title="Decline"
            >
              {loading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
            </button>
          </>
        )}

        {isBlocked && (
          <button
            type="button"
            onClick={() => patchRelationship({ blocked: false })}
            disabled={loading !== null}
            className={`p-1.5 rounded-md ${t.buttonGhost} transition-colors disabled:opacity-50`}
            title="Unblock"
          >
            {loading === 'blocked' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
