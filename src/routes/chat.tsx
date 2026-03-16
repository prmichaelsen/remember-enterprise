/**
 * Chat layout route — sidebar + conversation outlet.
 * All /chat/* routes render inside this layout.
 */

import { useState, useRef } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { GroupCreateModal } from '@/components/chat/GroupCreateModal'
import { useAuth } from '@/components/auth/AuthContext'
import { createConversation } from '@/services/conversation.service'
import { Modal } from '@/components/ui/Modal'
import { Search, MessageSquare } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/server-fn'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { buildProfileMap } from '@/lib/profile-map'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/chat')({
  component: ChatLayout,
  shouldReload: false,
  beforeLoad: async () => {
    if (typeof window !== 'undefined') return { initialConversations: [], initialProfiles: {} }
    try {
      const user = await getAuthSession()
      if (!user) return { initialConversations: [], initialProfiles: {} }
      const result = await ConversationDatabaseService.listConversations({ user_id: user.uid })
      console.log('[chat/beforeLoad] conversations', JSON.stringify({ count: result.conversations.length, sample: result.conversations.slice(0, 2).map(c => ({ id: c.id, type: c.type, title: c.title, participant_user_ids: c.participant_user_ids })) }))
      const allIds = [...new Set(result.conversations.flatMap((c) => c.participant_user_ids ?? []))]
      console.log('[chat/beforeLoad] resolving profiles for', allIds)
      const profiles = await buildProfileMap(allIds)
      console.log('[chat/beforeLoad] profiles', JSON.stringify(profiles))
      return { initialConversations: result.conversations, initialProfiles: profiles }
    } catch (err) {
      console.error('[chat/beforeLoad] FAILED', err)
      return { initialConversations: [], initialProfiles: {} }
    }
  },
})

function ChatLayout() {
  const t = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { initialConversations, initialProfiles } = Route.useRouteContext()

  const [showNewDm, setShowNewDm] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [dmSearchQuery, setDmSearchQuery] = useState('')
  const [dmSearchResults, setDmSearchResults] = useState<
    Array<{ uid: string; displayName: string; email: string; photoURL: string | null }>
  >([])
  const [dmSearching, setDmSearching] = useState(false)
  const [friends, setFriends] = useState<
    Array<{ uid: string; displayName: string; email: string; photoURL: string | null }>
  >([])
  const [friendsLoading, setFriendsLoading] = useState(false)

  const dmSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadFriends() {
    setFriendsLoading(true)
    try {
      const res = await fetch('/api/relationships?friend=true')
      const data = await res.json()
      const profiles = data.maps?.profiles ?? {}
      const friendList = (data.relationships ?? []).map((r: any) => {
        const profile = profiles[r.related_user_id] ?? {}
        return {
          uid: r.related_user_id,
          displayName: profile.displayName ?? 'Unknown',
          email: profile.email ?? '',
          photoURL: profile.photoURL ?? null,
        }
      })
      setFriends(friendList)
    } catch {
      // Friends load error
    } finally {
      setFriendsLoading(false)
    }
  }

  async function handleDmSearch(query: string) {
    setDmSearchQuery(query)
    if (dmSearchTimeoutRef.current) clearTimeout(dmSearchTimeoutRef.current)
    if (query.length < 2) {
      setDmSearchResults([])
      return
    }

    dmSearchTimeoutRef.current = setTimeout(async () => {
      setDmSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data: { users: Array<{ uid: string; displayName: string; email: string; photoURL: string | null }> } = await res.json()
        setDmSearchResults(data.users)
      } catch {
        // Search error
      } finally {
        setDmSearching(false)
      }
    }, 300)
  }

  async function handleStartDm(targetUserId: string) {
    if (!user) return

    try {
      const { conversation } = await createConversation({
        type: 'dm',
        participant_ids: [user.uid, targetUserId],
        created_by: user.uid,
      })

      setShowNewDm(false)
      setDmSearchQuery('')
      setDmSearchResults([])

      navigate({
        to: '/chat/$conversationId',
        params: { conversationId: conversation.id },
      })
    } catch {
      // Error creating DM
    }
  }

  function handleGroupCreated(conversationId: string) {
    setShowNewGroup(false)
    navigate({
      to: '/chat/$conversationId',
      params: { conversationId },
    })
  }

  return (
    <div className={`flex h-[calc(100vh-3.5rem)] overflow-hidden ${t.page}`}>
      {/* Conversation sidebar */}
      <ErrorBoundary name="ConversationSidebar">
        <ConversationSidebar
          onNewDm={() => { setShowNewDm(true); loadFriends() }}
          onNewGroup={() => setShowNewGroup(true)}
          initialConversations={initialConversations}
          initialProfiles={initialProfiles}
        />
      </ErrorBoundary>

      {/* Main conversation area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <ErrorBoundary name="ConversationView">
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* New DM modal */}
      <Modal
        isOpen={showNewDm}
        onClose={() => {
          setShowNewDm(false)
          setDmSearchQuery('')
          setDmSearchResults([])
        }}
        title="New Direct Message"
      >
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`}
            />
            <input
              type="text"
              value={dmSearchQuery}
              onChange={(e) => handleDmSearch(e.target.value)}
              placeholder="Search by name or email..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-base ${t.input} ${t.inputFocus} outline-none`}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {dmSearching || friendsLoading ? (
              <div className={`text-center py-4 text-sm ${t.textMuted}`}>
                {dmSearching ? 'Searching...' : 'Loading friends...'}
              </div>
            ) : dmSearchQuery.length >= 2 ? (
              dmSearchResults.length > 0 ? (
                <DmUserList users={dmSearchResults} onSelect={handleStartDm} t={t} />
              ) : (
                <div className={`text-center py-4 text-sm ${t.textMuted}`}>No users found</div>
              )
            ) : friends.length > 0 ? (
              <>
                <p className={`text-xs font-medium px-3 py-1.5 ${t.textMuted} uppercase tracking-wide`}>Friends</p>
                <DmUserList users={friends} onSelect={handleStartDm} t={t} />
              </>
            ) : (
              <div className="flex flex-col items-center py-6">
                <MessageSquare className={`w-8 h-8 mb-2 ${t.textMuted}`} />
                <p className={`text-sm ${t.textMuted}`}>Search for a user to start a conversation</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* New group modal */}
      <GroupCreateModal
        isOpen={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  )
}

function DmUserList({
  users,
  onSelect,
  t,
}: {
  users: Array<{ uid: string; displayName: string; email: string; photoURL: string | null }>
  onSelect: (uid: string) => void
  t: ReturnType<typeof useTheme>
}) {
  return (
    <div className="space-y-0.5">
      {users.map((u) => (
        <button
          key={u.uid}
          type="button"
          onClick={() => onSelect(u.uid)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${t.hover} transition-colors`}
        >
          {u.photoURL ? (
            <img src={u.photoURL} alt={u.displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.elevated}`}>
              <span className={`text-sm font-medium ${t.textSecondary}`}>
                {(u.displayName || u.email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-sm ${t.textPrimary}`}>{u.displayName}</p>
            <p className={`text-xs ${t.textMuted}`}>{u.email}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
