/**
 * Conversations layout route — sidebar list + detail outlet.
 * Same pattern as /chat: list on left, detail on right.
 * SSR preloaded via beforeLoad.
 */

import { useState } from 'react'
import { createFileRoute, Outlet, Link, useParams } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { getAuthSession } from '@/lib/auth/server-fn'
import { ConversationDatabaseService, type ConversationDoc } from '@/services/conversation-database.service'
import { MessageSquare, Users, Ghost, Menu, X } from 'lucide-react'

export const Route = createFileRoute('/conversations')({
  component: ConversationsLayout,
  beforeLoad: async () => {
    if (typeof window !== 'undefined') return { initialConversations: [] as ConversationDoc[] }
    try {
      const user = await getAuthSession()
      if (!user) return { initialConversations: [] as ConversationDoc[] }

      const result = await ConversationDatabaseService.listConversations({
        user_id: user.uid,
        limit: 100,
      })
      return { initialConversations: result.conversations }
    } catch {
      return { initialConversations: [] as ConversationDoc[] }
    }
  },
})

function ConversationsLayout() {
  const t = useTheme()
  const { user } = useAuth()
  const { initialConversations } = Route.useRouteContext()
  const conversations = initialConversations as ConversationDoc[]
  const params = useParams({ strict: false })
  const activeId = (params as Record<string, string>).conversationId ?? null
  const [mobileOpen, setMobileOpen] = useState(false)

  function getIcon(type: string) {
    switch (type) {
      case 'dm': return <MessageSquare className="w-5 h-5" />
      case 'group': return <Users className="w-5 h-5" />
      case 'ghost': return <Ghost className="w-5 h-5" />
      default: return <MessageSquare className="w-5 h-5" />
    }
  }

  function getLabel(type: string) {
    switch (type) {
      case 'dm': return 'DM'
      case 'group': return 'Group'
      case 'ghost': return 'Ghost'
      case 'chat': return 'Chat'
      default: return type
    }
  }

  function formatTime(iso: string | null | undefined): string {
    if (!iso) return ''
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function getName(conv: ConversationDoc): string {
    if (conv.name) return conv.name
    if (conv.title && conv.title !== 'Untitled') return conv.title
    if (conv.type === 'dm' && conv.participant_user_ids) {
      const other = conv.participant_user_ids.filter((id) => id !== user?.uid)
      return other.length > 0 ? other[0].slice(0, 8) + '...' : 'Direct Message'
    }
    return 'Conversation'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-border-default`}>
        <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Conversations</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${t.textMuted}`} />
            <p className={`text-sm ${t.textMuted}`}>No conversations yet</p>
          </div>
        ) : (
          <nav className="py-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId
              const name = getName(conv)

              return (
                <Link
                  key={conv.id}
                  to="/conversations/$conversationId"
                  params={{ conversationId: conv.id }}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive ? t.active : t.hover
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.elevated}`}>
                    {getIcon(conv.type)}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${t.textPrimary}`}>
                        {name}
                      </span>
                      <span className={`text-xs shrink-0 ml-2 ${t.textMuted}`}>
                        {formatTime(conv.last_message_at ?? conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${t.badgeDefault}`}>
                        {getLabel(conv.type)}
                      </span>
                      {conv.last_message_preview && (
                        <span className={`text-xs truncate ${t.textMuted}`}>
                          {conv.last_message_preview}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )

  return (
    <div className={`flex h-screen ${t.page}`}>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed top-3 left-3 z-50 p-2 rounded-lg lg:hidden ${t.buttonGhost} ${t.elevated}`}
        aria-label="Open conversations"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile: drawer, desktop: fixed column */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-80 z-50
          lg:relative lg:z-auto lg:w-80 lg:shrink-0
          transform transition-transform
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${t.sidebar}
        `}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={`p-2 rounded-lg ${t.buttonGhost}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Detail area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
