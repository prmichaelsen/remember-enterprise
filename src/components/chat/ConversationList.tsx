/**
 * ConversationList — renders the conversation list content.
 * Used by ConversationSidebar (desktop) and ChatIndex (mobile).
 */

import { useState, useEffect } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Link, useParams } from '@tanstack/react-router'
import { MessageSquare, Users, Plus, Globe } from 'lucide-react'
import { BrandIcon } from '@/components/BrandIcon'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { listConversations } from '@/services/conversation.service'
import type { Conversation } from '@/types/conversations'
import type { ProfileSummary } from '@/lib/profile-map'

interface ConversationListProps {
  onNewDm: () => void
  onNewGroup: () => void
  initialConversations?: Conversation[]
  initialProfiles?: Record<string, ProfileSummary>
}

export function ConversationList({ onNewDm, onNewGroup, initialConversations, initialProfiles }: ConversationListProps) {
  const t = useTheme()
  const { user } = useAuth()
  const params = useParams({ strict: false })
  const activeConversationId = (params as Record<string, string>).conversationId ?? null

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations ?? [])
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>(initialProfiles ?? {})
  const [loading, setLoading] = useState(!initialConversations || initialConversations.length === 0)

  useEffect(() => {
    if (!user) return
    if (initialConversations && initialConversations.length > 0) return

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const result = await listConversations({ user_id: user!.uid })
        if (!cancelled) {
          setConversations(result.conversations)
          setProfiles(result.profiles ?? {})
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
    if (conv.title && conv.title !== 'Untitled' && conv.title !== 'Untitled Conversation') return conv.title
    const otherIds = (conv.participant_user_ids ?? []).filter((id) => id !== user?.uid)
    if (otherIds.length === 0) return 'Chat'
    return otherIds.map((id) => profiles[id]?.display_name ?? id).join(', ')
  }

  function getLastMessagePreview(conv: Conversation): string | null {
    return conv.last_message_preview ?? null
  }

  function getLastMessageTimestamp(conv: Conversation): string | null {
    return conv.last_message_at ?? conv.updated_at ?? null
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

  const syntheticConversations: Array<{
    id: string
    name: string
    type: 'agent' | 'group'
    preview: string
    icon: React.ReactNode
  }> = [
    {
      id: 'main',
      name: 'Agent',
      type: 'agent',
      preview: 'Ask me anything',
      icon: <BrandIcon className="w-5 h-5" size="w-5 h-5" />,
    },
    {
      id: 'ghost:space:the_void',
      name: 'The Void',
      type: 'group',
      preview: 'Anonymous posting feed',
      icon: <Globe className="w-5 h-5" />,
    },
  ]

  function renderConversationItem(
    id: string,
    name: string,
    type: string,
    preview: string,
    avatar: React.ReactNode,
  ) {
    const isActive = id === activeConversationId
    return (
      <Link
        key={id}
        to="/chat/$conversationId"
        params={{ conversationId: id }}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          isActive ? t.active : t.hover
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.elevated}`}>
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium truncate ${t.textSecondary}`}>
              {name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                type === 'dm' ? 'bg-brand-primary/20 text-brand-primary'
                : type === 'group' ? 'bg-brand-secondary/20 text-brand-secondary'
                : 'bg-brand-accent/20 text-brand-accent'
              }`}>
                {type === 'dm' ? 'dm' : type === 'group' ? 'group' : 'agent'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-xs truncate ${t.textMuted}`}>
              {preview}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
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
      <div className="flex-1 min-h-0">
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
          <div>
            {syntheticConversations.map((s) =>
              renderConversationItem(s.id, s.name, s.type, s.preview, s.icon)
            )}
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
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            components={{
              Header: () => (
                <div>
                  {syntheticConversations.map((s) =>
                    renderConversationItem(s.id, s.name, s.type, s.preview, s.icon)
                  )}
                </div>
              ),
            }}
            data={conversations}
            computeItemKey={(_index, conv) => conv.id}
            itemContent={(_index, conv) => {
              const isActive = conv.id === activeConversationId
              const name = getConversationName(conv)

              return (
                <Link
                  to="/chat/$conversationId"
                  params={{ conversationId: conv.id }}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive ? t.active : t.hover
                  }`}
                >
                  {getAvatar(conv)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium truncate ${
                          (conv as any).unread_count > 0 ? t.textPrimary : t.textSecondary
                        }`}
                      >
                        {name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          conv.type === 'dm' ? 'bg-brand-primary/20 text-brand-primary'
                          : conv.type === 'group' ? 'bg-brand-secondary/20 text-brand-secondary'
                          : 'bg-brand-accent/20 text-brand-accent'
                        }`}>
                          {conv.type === 'dm' ? 'dm' : conv.type === 'group' ? 'group' : 'agent'}
                        </span>
                        {getLastMessageTimestamp(conv) && (
                          <span className={`text-xs ${t.textMuted}`}>
                            {formatTimestamp(getLastMessageTimestamp(conv)!)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${t.textMuted}`}>
                        {getLastMessagePreview(conv) ?? 'No messages yet'}
                      </span>
                      {(conv as any).unread_count > 0 && (
                        <span
                          className={`ml-2 shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${t.notificationBadge}`}
                        >
                          {(conv as any).unread_count > 99 ? '99+' : (conv as any).unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            }}
          />
        )}
      </div>
    </div>
  )
}
