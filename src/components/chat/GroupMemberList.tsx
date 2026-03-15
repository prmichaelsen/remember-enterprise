/**
 * GroupMemberList — displays group members with role badges, invite, and remove actions.
 * Respects ACL: only users with can_manage_members see invite, only can_kick see remove.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
  UserPlus,
  MoreVertical,
  Search,
  X,
  Plus,
} from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { GroupMember, GroupAuthLevel, GroupPermissions } from '@/types/conversations'
import { listGroupMembers, removeMember, inviteMember } from '@/services/group.service'
import { AUTH_LEVEL_LABELS } from '@/lib/services/group-acl.service'

interface GroupMemberListProps {
  conversationId: string
  currentUserPermissions?: {
    can_manage_members: boolean
    can_kick: boolean
  }
  onMemberCountChange?: (count: number) => void
}

interface SearchUser {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
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

function getRoleBadgeStyle(
  level: GroupAuthLevel,
  t: ReturnType<typeof import('@/lib/theming').useTheme>
): string {
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

export function GroupMemberList({
  conversationId,
  currentUserPermissions,
  onMemberCountChange,
}: GroupMemberListProps) {
  const t = useTheme()
  const { user } = useAuth()
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteResults, setInviteResults] = useState<SearchUser[]>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [inviting, setInviting] = useState(false)

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
          onMemberCountChange?.(result.length)
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
  }, [conversationId, onMemberCountChange])

  // Stub: user search for invite
  const searchUsersForInvite = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setInviteResults([])
        return
      }

      setInviteSearching(true)
      try {
        // Stub: server function for user search
        // const results = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        // Filter out existing members
        // setInviteResults(results.filter(u => !members.some(m => m.user_id === u.uid)))
        setInviteResults([])
      } catch {
        // Search error
      } finally {
        setInviteSearching(false)
      }
    },
    [members]
  )

  function handleInviteSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setInviteQuery(query)
    searchUsersForInvite(query)
  }

  async function handleInviteUser(searchUser: SearchUser) {
    if (!user) return
    if (members.some((m) => m.user_id === searchUser.uid)) return

    setInviting(true)
    try {
      const newMember = await inviteMember(conversationId, searchUser.uid)
      // Update the member with display info from search result
      const memberWithInfo: GroupMember = {
        ...newMember,
        display_name: searchUser.displayName || searchUser.email,
        photo_url: searchUser.photoURL,
      }
      setMembers((prev) => {
        const updated = [...prev, memberWithInfo]
        updated.sort((a, b) => a.auth_level - b.auth_level)
        onMemberCountChange?.(updated.length)
        return updated
      })
      setInviteQuery('')
      setInviteResults([])
    } catch (err) {
      console.error('Failed to invite member:', err)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!user) return

    try {
      await removeMember(conversationId, userId)
      setMembers((prev) => {
        const updated = prev.filter((m) => m.user_id !== userId)
        onMemberCountChange?.(updated.length)
        return updated
      })
    } catch (err) {
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
      {/* Header with member count and invite button */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className={`${t.textMuted} text-xs font-medium uppercase tracking-wider`}>
          Members ({members.length})
        </span>
        {currentUserPermissions?.can_manage_members && (
          <button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${t.buttonGhost} transition-colors`}
          >
            {showInvite ? (
              <>
                <X className="w-3.5 h-3.5" />
                Close
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </>
            )}
          </button>
        )}
      </div>

      {/* Invite section */}
      {showInvite && currentUserPermissions?.can_manage_members && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
            <input
              type="text"
              value={inviteQuery}
              onChange={handleInviteSearchChange}
              placeholder="Search by name or email..."
              disabled={inviting}
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${t.input} ${t.inputFocus} outline-none disabled:opacity-50`}
            />
          </div>

          {/* Invite search results */}
          {(inviteResults.length > 0 || inviteSearching) && (
            <div className={`mt-1 rounded-lg overflow-hidden ${t.card}`}>
              {inviteSearching ? (
                <div className={`px-3 py-2 text-sm ${t.textMuted}`}>Searching...</div>
              ) : (
                inviteResults.map((result) => {
                  const alreadyMember = members.some((m) => m.user_id === result.uid)
                  return (
                    <button
                      key={result.uid}
                      type="button"
                      onClick={() => handleInviteUser(result)}
                      disabled={alreadyMember || inviting}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left ${t.hover} transition-colors disabled:opacity-50`}
                    >
                      {result.photoURL ? (
                        <img
                          src={result.photoURL}
                          alt={result.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.elevated}`}>
                          <span className={`text-xs font-medium ${t.textSecondary}`}>
                            {(result.displayName || result.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${t.textPrimary}`}>
                          {result.displayName}
                        </p>
                        <p className={`text-xs truncate ${t.textMuted}`}>
                          {result.email}
                        </p>
                      </div>
                      {alreadyMember ? (
                        <span className={`text-xs ${t.textMuted}`}>Member</span>
                      ) : (
                        <Plus className={`w-4 h-4 ${t.textMuted}`} />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Member list */}
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
