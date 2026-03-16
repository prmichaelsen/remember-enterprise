/**
 * Friends page — three-tab view: Friends, Requests, Blocked.
 * Header includes FriendLinkShare button for one-click invite generation.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Users, Clock, ShieldOff } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { FriendLinkShare } from '@/components/friends/FriendLinkShare'
import { RelationshipRow } from '@/components/friends/RelationshipRow'
import type { RelationshipIndexEntry } from '@/services/relationship-database.service'
import type { ProfileSummary } from '@/lib/profile-map'

export const Route = createFileRoute('/friends')({
  component: FriendsPage,
})

type Tab = 'friends' | 'requests' | 'blocked'

function FriendsPage() {
  const t = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [relationships, setRelationships] = useState<RelationshipIndexEntry[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({})
  const [loading, setLoading] = useState(true)

  const fetchRelationships = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      let url = '/api/relationships?'
      if (activeTab === 'friends') {
        url += 'friend=true'
      } else if (activeTab === 'requests') {
        url += 'pending_friend=true'
      } else if (activeTab === 'blocked') {
        url += 'blocked=true'
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as {
          relationships: RelationshipIndexEntry[]
          maps?: { profiles: Record<string, ProfileSummary> }
        }
        setRelationships(data.relationships)
        setProfiles(data.maps?.profiles ?? {})
      }
    } catch (error) {
      console.error('[FriendsPage] fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab])

  useEffect(() => {
    fetchRelationships()
  }, [fetchRelationships])

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'requests', label: 'Requests', icon: Clock },
    { id: 'blocked', label: 'Blocked', icon: ShieldOff },
  ]

  const emptyMessages: Record<Tab, string> = {
    friends: 'No friends yet. Share an invite link to connect!',
    requests: 'No pending friend requests.',
    blocked: 'No blocked users.',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-xl font-bold ${t.textPrimary}`}>Friends</h1>
        <FriendLinkShare />
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 mb-4 border-b ${t.borderSubtle} pb-px`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? `${t.textPrimary} font-medium border-b-2 border-blue-500`
                : `${t.textMuted} ${t.hover}`
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-1">
        {loading ? (
          <div className={`text-center py-12 ${t.textMuted} text-sm`}>Loading...</div>
        ) : relationships.length === 0 ? (
          <div className={`text-center py-12 ${t.textMuted} text-sm`}>
            {emptyMessages[activeTab]}
          </div>
        ) : (
          relationships.map((r) => (
            <RelationshipRow
              key={r.relationship_id}
              relationship={r}
              profile={profiles[r.related_user_id]}
              currentUserId={user?.uid ?? ''}
              onUpdate={fetchRelationships}
            />
          ))
        )}
      </div>
    </div>
  )
}
