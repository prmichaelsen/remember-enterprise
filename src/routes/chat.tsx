/**
 * Chat layout route — sidebar + conversation outlet.
 * All /chat/* routes render inside this layout.
 */

import { useState } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { GroupCreateModal } from '@/components/chat/GroupCreateModal'
import { useAuth } from '@/components/auth/AuthContext'
import { createConversation } from '@/services/conversation.service'
import { Modal } from '@/components/ui/Modal'
import { Search, MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/chat')({
  component: ChatLayout,
})

function ChatLayout() {
  const t = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showNewDm, setShowNewDm] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [dmSearchQuery, setDmSearchQuery] = useState('')
  const [dmSearchResults, setDmSearchResults] = useState<
    Array<{ uid: string; displayName: string; email: string; photoURL: string | null }>
  >([])
  const [dmSearching, setDmSearching] = useState(false)

  async function handleDmSearch(query: string) {
    setDmSearchQuery(query)
    if (query.length < 2) {
      setDmSearchResults([])
      return
    }

    setDmSearching(true)
    try {
      // Stub: search users by name/email
      // const results = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      // setDmSearchResults(await results.json())
      setDmSearchResults([])
    } catch {
      // Search error
    } finally {
      setDmSearching(false)
    }
  }

  async function handleStartDm(targetUserId: string) {
    if (!user) return

    try {
      const conversation = await createConversation({
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
    <div className={`flex h-screen ${t.page}`}>
      {/* Conversation sidebar */}
      <ConversationSidebar
        onNewDm={() => setShowNewDm(true)}
        onNewGroup={() => setShowNewGroup(true)}
      />

      {/* Main conversation area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
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
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${t.input} ${t.inputFocus} outline-none`}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {dmSearching ? (
              <div className={`text-center py-4 text-sm ${t.textMuted}`}>
                Searching...
              </div>
            ) : dmSearchResults.length > 0 ? (
              <div className="space-y-0.5">
                {dmSearchResults.map((result) => (
                  <button
                    key={result.uid}
                    type="button"
                    onClick={() => handleStartDm(result.uid)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${t.hover} transition-colors`}
                  >
                    {result.photoURL ? (
                      <img
                        src={result.photoURL}
                        alt={result.displayName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${t.elevated}`}
                      >
                        <span className={`text-sm font-medium ${t.textSecondary}`}>
                          {(result.displayName || result.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm ${t.textPrimary}`}>
                        {result.displayName}
                      </p>
                      <p className={`text-xs ${t.textMuted}`}>{result.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : dmSearchQuery.length >= 2 ? (
              <div className={`text-center py-4 text-sm ${t.textMuted}`}>
                No users found
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <MessageSquare className={`w-8 h-8 mb-2 ${t.textMuted}`} />
                <p className={`text-sm ${t.textMuted}`}>
                  Search for a user to start a conversation
                </p>
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
