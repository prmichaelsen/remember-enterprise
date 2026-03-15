/**
 * ConversationSidebar — lists user conversations with navigation.
 * Responsive: full on desktop, collapsible hamburger on mobile.
 */

import { useState, useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { MessageSquare, Users, Menu, X, Plus } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { listConversations } from '@/services/conversation.service'
import type { Conversation } from '@/types/conversations'

interface ConversationSidebarProps {
  onNewDm: () => void
  onNewGroup: () => void
  initialConversations?: Conversation[]
}

export function ConversationSidebar({ onNewDm, onNewGroup, initialConversations }: ConversationSidebarProps) {
  const t = useTheme()
  const { user } = useAuth()
  const params = useParams({ strict: false })
  const activeConversationId = (params as Record<string, string>).conversationId ?? null

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations ?? [])
  const [loading, setLoading] = useState(!initialConversations || initialConversations.length === 0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    // Skip client-side fetch when SSR data exists
    if (initialConversations && initialConversations.length > 0) return

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const result = await listConversations({ user_id: user!.uid })
        if (!cancelled) {
          setConversations(result.conversations)
        }
      } catch {
        // Error loading conversations
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, initialConversations])

  /** Update sidebar from external events (new messages, etc.) */
  function updateConversation(updated: Conversation) {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id)
      if (idx === -1) return [updated, ...prev]
      const next = [...prev]
      next.splice(idx, 1)
      return [updated, ...next] // Move to top (most recent)
    })
  }

  // Expose updateConversation for parent components via ref or context
  // For now, parent can re-trigger listConversations

  function formatTimestamp(iso: string): string {
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

  function getConversationName(conv: Conversation): string {
    // Try name, title, then fall back to participant IDs
    const name = conv.name ?? (conv as any).title
    if (name) return name
    const ids = conv.participant_ids ?? (conv as any).participant_user_ids ?? []
    const otherIds = ids.filter((id: string) => id !== user?.uid)
    return otherIds.length > 0 ? otherIds.join(', ') : 'Chat'
  }

  function getLastMessagePreview(conv: Conversation): string | null {
    // Handle both nested last_message object and flat last_message_preview string
    if (conv.last_message?.content) return conv.last_message.content
    if ((conv as any).last_message_preview) return (conv as any).last_message_preview
    return null
  }

  function getLastMessageTimestamp(conv: Conversation): string | null {
    if (conv.last_message?.timestamp) return conv.last_message.timestamp
    if ((conv as any).last_message_at) return (conv as any).last_message_at
    if ((conv as any).updated_at) return (conv as any).updated_at
    return null
  }

  function getAvatar(conv: Conversation) {
    const name = getConversationName(conv)
    const initial = name.charAt(0).toUpperCase()
    const isGroup = conv.type === 'group'

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.elevated}`}
      >
        {isGroup ? (
          <Users className="w-5 h-5" />
        ) : (
          <span className={`text-sm font-medium ${t.textPrimary}`}>{initial}</span>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with action buttons */}
      <div className={`flex items-center justify-between p-4 ${t.border} border-t-0 border-l-0 border-r-0`}>
        <h2 className={`text-lg font-semibold ${t.textPrimary}`}>Messages</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onNewDm}
            className={`p-2 rounded-lg ${t.buttonGhost}`}
            title="New direct message"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNewGroup}
            className={`p-2 rounded-lg ${t.buttonGhost}`}
            title="New group"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className={`w-10 h-10 rounded-full ${t.elevated}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-24 rounded ${t.elevated}`} />
                  <div className={`h-3 w-40 rounded ${t.elevated}`} />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${t.textMuted}`} />
            <p className={`text-sm ${t.textMuted}`}>No conversations yet</p>
            <button
              type="button"
              onClick={onNewDm}
              className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${t.buttonPrimary}`}
            >
              <Plus className="w-4 h-4" />
              Start a conversation
            </button>
          </div>
        ) : (
          <nav className="py-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId
              const name = getConversationName(conv)

              return (
                <Link
                  key={conv.id}
                  to="/chat/$conversationId"
                  params={{ conversationId: conv.id }}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive ? t.active : t.hover
                  }`}
                >
                  {getAvatar(conv)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium truncate ${
                          conv.unread_count > 0 ? t.textPrimary : t.textSecondary
                        }`}
                      >
                        {name}
                      </span>
                      {getLastMessageTimestamp(conv) && (
                        <span className={`text-xs shrink-0 ml-2 ${t.textMuted}`}>
                          {formatTimestamp(getLastMessageTimestamp(conv)!)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${t.textMuted}`}>
                        {getLastMessagePreview(conv) ?? 'No messages yet'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span
                          className={`ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${t.notificationBadge}`}
                        >
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
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
    <>
      {/* Mobile hamburger toggle — positioned below the unified header (h-14 = 3.5rem) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed top-16 left-3 z-40 p-2 rounded-lg lg:hidden ${t.buttonGhost} ${t.elevated}`}
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

      {/* Sidebar — mobile: sliding drawer, desktop: fixed column */}
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
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={`p-2 rounded-lg ${t.buttonGhost}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sidebarContent}
      </aside>
    </>
  )
}
