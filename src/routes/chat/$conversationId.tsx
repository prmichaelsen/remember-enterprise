/**
 * Conversation route — renders the active conversation with messages,
 * compose input, real-time updates via WebSocket, and group member panel.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { MessageList } from '@/components/chat/MessageList'
import { MessageCompose } from '@/components/chat/MessageCompose'
import { MemberList } from '@/components/chat/MemberList'
import { SubHeaderTabs, type SubHeaderTab } from '@/components/SubHeaderTabs'
import { GhostChatView } from '@/components/ghost/GhostChatView'
import { getConversation, updateLastMessage } from '@/services/conversation.service'
import { listMessages, sendMessage, markConversationRead } from '@/services/message.service'
import { checkPermission } from '@/services/group.service'
import type { Conversation, Message, MessagePreview } from '@/types/conversations'
import type {
  NewMessageEvent,
  TypingEvent,
  AgentResponseChunkEvent,
  ToolCallStartEvent,
  ToolCallCompleteEvent,
  AgentResponseCompleteEvent,
} from '@/types/websocket'
import type { StreamingBlock } from '@/types/streaming'
import {
  appendTextChunk,
  insertToolUseBlock,
  completeToolUseBlock,
} from '@/types/streaming'
import { Users, ChevronLeft, Wifi, WifiOff, Ghost } from 'lucide-react'
import { ConversationHeaderMenu } from '@/components/chat/ConversationHeaderMenu'
import { AddParticipantModal } from '@/components/chat/AddParticipantModal'
import { getAuthSession } from '@/lib/auth/server-fn'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { MessageDatabaseService } from '@/services/message-database.service'
import { getTextContent } from '@/lib/message-content'

const CONVERSATION_TABS: SubHeaderTab[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'ghost', label: 'Ghost', variant: 'ghost', icon: <Ghost className="w-4 h-4" /> },
]

export const Route = createFileRoute('/chat/$conversationId')({
  component: ConversationView,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: search.tab as string | undefined,
  }),
  beforeLoad: async ({ params }) => {
    if (typeof window !== 'undefined') return { initialConversation: null, initialMessages: [] }
    try {
      const user = await getAuthSession()
      if (!user) return { initialConversation: null, initialMessages: [] }
      const [conversation, msgResult] = await Promise.all([
        ConversationDatabaseService.getConversation(params.conversationId),
        MessageDatabaseService.listMessages(params.conversationId, 50),
      ])
      return {
        initialConversation: conversation,
        initialMessages: msgResult.messages ?? [],
      }
    } catch {
      return { initialConversation: null, initialMessages: [] }
    }
  },
})

function ConversationView() {
  const t = useTheme()
  const { user } = useAuth()
  const { conversationId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate()

  const activeTab = tab || 'chat'

  function handleTabChange(newTab: string) {
    navigate({
      to: '/chat/$conversationId',
      params: { conversationId },
      search: { tab: newTab },
      replace: true,
    })
  }

  // State
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [typingUsers, setTypingUsers] = useState<
    Array<{ user_id: string; user_name: string }>
  >([])
  const [currentUserPermissions, setCurrentUserPermissions] = useState<{
    can_manage_members: boolean
    can_kick: boolean
  }>({ can_manage_members: false, can_kick: false })
  const [showAddParticipant, setShowAddParticipant] = useState(false)

  // Streaming blocks state for real-time agent generation
  const [streamingBlocks, setStreamingBlocks] = useState<StreamingBlock[]>([])
  const streamingMessageIdRef = useRef<string | null>(null)

  // WebSocket for real-time
  const { status: wsStatus, lastMessage: wsMessage, send: wsSend } = useWebSocket(conversationId)

  // Typing indicator debounce refs
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Load conversation and initial messages
  useEffect(() => {
    if (!user || !conversationId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setMessages([])
      setHasMore(false)
      setStreamingBlocks([])
      streamingMessageIdRef.current = null

      try {
        const [conv, msgResult] = await Promise.all([
          getConversation(conversationId),
          listMessages({ conversation_id: conversationId, limit: 50 }),
        ])

        if (cancelled) return

        setConversation(conv)
        // Messages come newest-first from service, reverse for display
        setMessages(msgResult.messages.reverse())
        setHasMore(msgResult.has_more)

        // Mark as read
        markConversationRead(conversationId)

        // Load permissions for group conversations
        if (conv?.type === 'group') {
          const [canManage, canKick] = await Promise.all([
            checkPermission(conversationId, user!.uid, 'can_manage_members'),
            checkPermission(conversationId, user!.uid, 'can_kick'),
          ])
          if (!cancelled) {
            setCurrentUserPermissions({
              can_manage_members: canManage,
              can_kick: canKick,
            })
          }
        }
      } catch {
        // Error loading conversation
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [conversationId, user])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!wsMessage || !user) return

    switch (wsMessage.type) {
      case 'message_new': {
        const event = wsMessage as NewMessageEvent
        if (event.conversation_id !== conversationId) return

        // Append new message to list
        const newMsg: Message = {
          id: event.message.id,
          conversation_id: event.conversation_id,
          role: event.message.role,
          content: event.message.content,
          timestamp: event.message.timestamp,
          sender_user_id: event.message.sender_user_id,
          visible_to_user_ids: event.message.visible_to_user_ids,
        }

        setMessages((prev) => [...prev, newMsg])

        // Update sidebar last_message preview
        updateLastMessage(conversationId, {
          content: getTextContent(newMsg.content),
          sender_user_id: newMsg.sender_user_id ?? '',
          timestamp: newMsg.timestamp,
        })

        // Auto-mark as read if this is the active conversation
        markConversationRead(conversationId)

        // Clear typing indicator for this sender
        if (event.message.sender_user_id) {
          setTypingUsers((prev) =>
            prev.filter((tu) => tu.user_id !== event.message.sender_user_id)
          )
        }
        break
      }

      case 'typing_start': {
        const event = wsMessage as TypingEvent
        if (event.conversation_id !== conversationId) return
        if (event.user_id === user.uid) return // Ignore own typing

        setTypingUsers((prev) => {
          if (prev.some((tu) => tu.user_id === event.user_id)) return prev
          return [...prev, { user_id: event.user_id, user_name: event.user_name }]
        })

        // Auto-clear typing after 3 seconds (in case typing_stop is missed)
        const existing = typingTimeoutsRef.current.get(event.user_id)
        if (existing) clearTimeout(existing)

        const timeout = setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((tu) => tu.user_id !== event.user_id)
          )
          typingTimeoutsRef.current.delete(event.user_id)
        }, 3000)

        typingTimeoutsRef.current.set(event.user_id, timeout)
        break
      }

      case 'typing_stop': {
        const event = wsMessage as TypingEvent
        if (event.conversation_id !== conversationId) return

        setTypingUsers((prev) =>
          prev.filter((tu) => tu.user_id !== event.user_id)
        )

        const timeout = typingTimeoutsRef.current.get(event.user_id)
        if (timeout) {
          clearTimeout(timeout)
          typingTimeoutsRef.current.delete(event.user_id)
        }
        break
      }

      case 'agent_response_chunk': {
        const event = wsMessage as AgentResponseChunkEvent
        if (event.conversation_id !== conversationId) return

        // Track which message we're streaming
        if (streamingMessageIdRef.current !== event.message_id) {
          streamingMessageIdRef.current = event.message_id
          setStreamingBlocks([])
        }

        setStreamingBlocks((prev) => appendTextChunk(prev, event.chunk))
        break
      }

      case 'tool_call_start': {
        const event = wsMessage as ToolCallStartEvent
        if (event.conversation_id !== conversationId) return

        // Ensure we're tracking this message
        if (streamingMessageIdRef.current !== event.message_id) {
          streamingMessageIdRef.current = event.message_id
          setStreamingBlocks([])
        }

        setStreamingBlocks((prev) =>
          insertToolUseBlock(prev, event.tool_call_id, event.tool_name)
        )
        break
      }

      case 'tool_call_complete': {
        const event = wsMessage as ToolCallCompleteEvent
        if (event.conversation_id !== conversationId) return

        setStreamingBlocks((prev) =>
          completeToolUseBlock(prev, event.tool_call_id, event.status, event.result)
        )
        break
      }

      case 'agent_response_complete': {
        const event = wsMessage as AgentResponseCompleteEvent
        if (event.conversation_id !== conversationId) return

        // Add the final assembled message to the messages array
        const finalMsg: Message = {
          id: event.message.id,
          conversation_id: event.conversation_id,
          role: 'assistant',
          content: event.message.content,
          timestamp: new Date().toISOString(),
          sender_user_id: 'agent',
          visible_to_user_ids: event.message.visible_to_user_ids,
        }

        setMessages((prev) => [...prev, finalMsg])

        // Clear streaming state
        setStreamingBlocks([])
        streamingMessageIdRef.current = null

        // Update sidebar preview
        updateLastMessage(conversationId, {
          content: getTextContent(finalMsg.content),
          sender_user_id: finalMsg.sender_user_id ?? '',
          timestamp: finalMsg.timestamp,
        })
        break
      }
    }
  }, [wsMessage, conversationId, user])

  // Cleanup typing timeouts
  useEffect(() => {
    return () => {
      for (const timeout of typingTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      typingTimeoutsRef.current.clear()
    }
  }, [conversationId])

  // Load older messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return

    setLoadingMore(true)
    try {
      const oldestMessage = messages[0]
      const result = await listMessages({
        conversation_id: conversationId,
        limit: 50,
        before_cursor: oldestMessage.id,
      })

      setMessages((prev) => [...result.messages.reverse(), ...prev])
      setHasMore(result.has_more)
    } catch {
      // Error loading more messages
    } finally {
      setLoadingMore(false)
    }
  }, [conversationId, loadingMore, hasMore, messages])

  // Send message handler
  async function handleSend(content: string) {
    if (!user) return

    try {
      const message = await sendMessage({
        conversation_id: conversationId,
        sender_user_id: user.uid,
        content,
      })

      // Optimistic: add to local state immediately
      setMessages((prev) => [...prev, message])

      // Broadcast via WebSocket
      const wsMsg: NewMessageEvent = {
        type: 'message_new',
        conversation_id: conversationId,
        message: {
          id: message.id,
          sender_user_id: message.sender_user_id,
          content: message.content,
          timestamp: message.timestamp,
          visible_to_user_ids: message.visible_to_user_ids ?? null,
          role: message.role,
        },
      }
      wsSend(wsMsg)

      // Update conversation preview
      updateLastMessage(conversationId, {
        content: getTextContent(message.content),
        sender_user_id: message.sender_user_id ?? '',
        timestamp: message.timestamp,
      })
    } catch {
      // Error sending message — in production, show toast and retry
    }
  }

  // Typing indicator handlers
  function handleTypingStart() {
    if (!user) return
    wsSend({
      type: 'typing_start',
      conversation_id: conversationId,
      user_id: user.uid,
      user_name: user.displayName ?? 'Unknown',
    })
  }

  function handleTypingStop() {
    if (!user) return
    wsSend({
      type: 'typing_stop',
      conversation_id: conversationId,
      user_id: user.uid,
      user_name: user.displayName ?? 'Unknown',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${t.page}`}>
        <div className={`text-sm ${t.textMuted}`}>Loading conversation...</div>
      </div>
    )
  }

  // Conversation not found
  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center ${t.page}`}>
        <div className="text-center">
          <p className={`text-lg font-medium ${t.textPrimary}`}>
            Conversation not found
          </p>
          <p className={`text-sm mt-1 ${t.textMuted}`}>
            This conversation may have been deleted or you don't have access.
          </p>
        </div>
      </div>
    )
  }

  const conversationName =
    conversation.name ??
    ((conversation.participant_ids ?? [])
      .filter((id) => id !== user?.uid)
      .join(', ') || 'Conversation')

  const isGroup = conversation.type === 'group'

  return (
    <div className="flex flex-1 h-full min-h-0">
      {/* Main conversation panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-4 py-3 shrink-0 ${t.border} border-t-0 border-l-0 border-r-0`}
        >
          {/* Back button (mobile) */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className={`p-1.5 rounded-lg lg:hidden ${t.buttonGhost}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Conversation info */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-sm font-semibold truncate ${t.textPrimary}`}>
              {conversationName}
            </h1>
            {isGroup && conversation.description && (
              <p className={`text-xs truncate ${t.textMuted}`}>
                {conversation.description}
              </p>
            )}
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            {wsStatus === 'connected' ? (
              <Wifi className={`w-4 h-4 ${t.statusOnline}`} style={{ color: 'currentColor' }} />
            ) : (
              <WifiOff className={`w-4 h-4 ${t.textMuted}`} />
            )}

            {/* Group members toggle */}
            {isGroup && (
              <button
                type="button"
                onClick={() => setShowMembers(!showMembers)}
                className={`p-1.5 rounded-lg ${showMembers ? t.active : t.buttonGhost}`}
              >
                <Users className="w-5 h-5" />
              </button>
            )}

            {/* Group header menu */}
            <ConversationHeaderMenu
              conversationId={conversationId}
              isGroup={isGroup}
              canManageMembers={currentUserPermissions.can_manage_members}
              onAddParticipant={() => setShowAddParticipant(true)}
              onManageMembers={() => setShowMembers(true)}
              onShareLink={() => setShowAddParticipant(true)}
            />
          </div>
        </div>

        {/* Sub-header tabs */}
        <SubHeaderTabs
          tabs={CONVERSATION_TABS}
          activeId={activeTab}
          onSelect={handleTabChange}
        />

        {activeTab === 'ghost' ? (
          /* Ghost chat view */
          <div className="flex-1 min-h-0">
            <GhostChatView
              ghostOwnerId={
                conversation?.type === 'group'
                  ? `group:${conversationId}`
                  : (conversation?.participant_ids ?? []).find((id) => id !== user?.uid) ?? conversationId
              }
            />
          </div>
        ) : (
          <>
            {/* Messages */}
            <MessageList
              messages={messages}
              conversationId={conversationId}
              loading={loadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              typingUsers={typingUsers}
              streamingBlocks={streamingBlocks}
            />

            {/* Compose */}
            <MessageCompose
              conversationId={conversationId}
              senderId={user?.uid ?? ''}
              onSend={handleSend}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          </>
        )}
      </div>

      {/* Members panel (groups only) */}
      {isGroup && showMembers && (
        <aside
          className={`w-64 shrink-0 overflow-y-auto ${t.sidebar} hidden lg:block`}
        >
          <MemberList
            conversationId={conversationId}
            currentUserPermissions={currentUserPermissions}
          />
        </aside>
      )}

      {/* Add participant modal */}
      <AddParticipantModal
        isOpen={showAddParticipant}
        onClose={() => setShowAddParticipant(false)}
        conversationId={conversationId}
      />
    </div>
  )
}
