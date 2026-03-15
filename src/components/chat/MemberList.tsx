/**
 * MemberList — displays group members with role badges and management actions.
 */

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, Crown, UserMinus, MoreVertical } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { GroupMember, GroupAuthLevel } from '@/types/conversations'
import { listGroupMembers, removeMember } from '@/services/group.service'

interface MemberListProps {
  conversationId: string
  currentUserPermissions?: {
    can_manage_members: boolean
    can_kick: boolean
  }
}

const AUTH_LEVEL_LABELS: Record<GroupAuthLevel, string> = {
  0: 'Owner',
  1: 'Admin',
  3: 'Editor',
  5: 'Member',
}

function AuthLevelIcon({ level }: { level: GroupAuthLevel }) {
  switch (level) {
    case 0:
      return <Crown className="w-3.5 h-3.5" />
    case 1:
      return <ShieldCheck className="w-3.5 h-3.5" />
    case 3:
      return <Shield className="w-3.5 h-3.5" />
    default:
      return null
  }
}

function getRoleBadgeStyle(level: GroupAuthLevel, t: ReturnType<typeof import('@/lib/theming').useTheme>): string {
  switch (level) {
    case 0:
      return t.badgeWarning
    case 1:
      return t.badgeInfo
    case 3:
      return t.badgeSuccess
    default:
      return t.badgeDefault
  }
}

export function MemberList({
  conversationId,
  currentUserPermissions,
}: MemberListProps) {
  const t = useTheme()
  const { user } = useAuth()
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const result = await listGroupMembers(conversationId)
        if (!cancelled) {
          // Sort: owners first, then admins, editors, members
          result.sort((a, b) => a.auth_level - b.auth_level)
          setMembers(result)
        }
      } catch {
        // Error loading members
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  async function handleRemoveMember(userId: string) {
    if (!user) return

    try {
      await removeMember(conversationId, userId, user.uid)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch (err) {
      // Error removing member — in production, show toast
      console.error('Failed to remove member:', err)
    } finally {
      setActionMenuOpen(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className={`w-9 h-9 rounded-full ${t.elevated}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3.5 w-24 rounded ${t.elevated}`} />
              <div className={`h-3 w-16 rounded ${t.elevated}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className={`px-4 py-2 ${t.textMuted} text-xs font-medium uppercase tracking-wider`}>
        Members ({members.length})
      </div>

      <div className="space-y-0.5">
        {members.map((member) => {
          const isSelf = member.user_id === user?.uid
          const canKick =
            currentUserPermissions?.can_kick &&
            !isSelf &&
            member.auth_level !== 0 // Cannot kick owner

          return (
            <div
              key={member.user_id}
              className={`flex items-center gap-3 px-4 py-2 ${t.hover} transition-colors`}
            >
              {/* Avatar */}
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.display_name}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.elevated}`}
                >
                  <span className={`text-sm font-medium ${t.textSecondary}`}>
                    {member.display_name
                      ? member.display_name.charAt(0).toUpperCase()
                      : '?'}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${t.textPrimary}`}>
                    {member.display_name || 'Unknown'}
                    {isSelf && (
                      <span className={`ml-1 text-xs ${t.textMuted}`}>(you)</span>
                    )}
                  </span>
                </div>

                {/* Role badge */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeStyle(member.auth_level, t)}`}
                >
                  <AuthLevelIcon level={member.auth_level} />
                  {AUTH_LEVEL_LABELS[member.auth_level]}
                </span>
              </div>

              {/* Actions */}
              {canKick && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActionMenuOpen(
                        actionMenuOpen === member.user_id ? null : member.user_id
                      )
                    }
                    className={`p-1.5 rounded-lg ${t.buttonGhost}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {actionMenuOpen === member.user_id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActionMenuOpen(null)}
                      />
                      <div
                        className={`absolute right-0 top-full mt-1 z-20 w-40 rounded-lg overflow-hidden shadow-lg ${t.card}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${t.hover} transition-colors`}
                        >
                          <UserMinus className="w-4 h-4" />
                          <span className={t.textPrimary}>Remove</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
