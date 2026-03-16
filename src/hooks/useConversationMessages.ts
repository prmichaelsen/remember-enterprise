/**
 * useConversationMessages — manages message state with WebSocket integration.
 * Handles new messages from WebSocket, typing events, sidebar last-message
 * updates, and unread count increments for background conversations.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { listMessages, sendMessage, markConversationRead } from '@/services/message.service'
import { updateLastMessage } from '@/services/conversation.service'
import type { Message } from '@/types/conversations'

type LastMessagePreview = { content: string; sender_user_id: string; timestamp: string }
import type { ServerMessageEvent, TypingEvent } from '@/types/websocket'
import { getTextContent } from '@/lib/message-content'

interface UseConversationMessagesParams {
  conversationId: string
  userId: string
}

interface TypingUser {
  user_id: string
  user_name: string
}

interface UseConversationMessagesReturn {
  messages: Message[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  typingUsers: TypingUser[]
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  /** Load older messages (scroll-up pagination). */
  loadMore: () => Promise<void>

  /** Send a new message. */
  send: (content: string) => Promise<void>

  /** Notify other participants that this user started typing. */
  sendTypingStart: () => void

  /** Notify other participants that this user stopped typing. */
  sendTypingStop: () => void

  /** Callback for sidebar: invoked when a new message should update sidebar state. */
  onSidebarUpdate: ((preview: LastMessagePreview, conversationId: string) => void) | null
  setOnSidebarUpdate: (cb: ((preview: LastMessagePreview, conversationId: string) => void) | null) => void
}

export function useConversationMessages({
  conversationId,
  userId,
}: UseConversationMessagesParams): UseConversationMessagesReturn {
  // Message state
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Typing state
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Sidebar update callback
  const [onSidebarUpdate, setOnSidebarUpdate] = useState<
    ((preview: LastMessagePreview, conversationId: string) => void) | null
  >(null)

  // WebSocket
  const { status: wsStatus, lastMessage: wsMessage, send: wsSend } = useWebSocket(conversationId)

  // ── Load initial messages ──────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !userId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setMessages([])
      setHasMore(false)
      setTypingUsers([])

      try {
        const result = await listMessages({
          conversation_id: conversationId,
          limit: 50,
        })

        if (cancelled) return

        // Messages come newest-first from service; reverse for display
        setMessages(result.messages.reverse())
        setHasMore(result.has_more)

        // Mark as read
        markConversationRead(conversationId)
      } catch {
        // Error loading messages
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [conversationId, userId])

  // ── Handle incoming WebSocket messages ─────────────────────────────────
  useEffect(() => {
    if (!wsMessage || !userId) return

    switch (wsMessage.type) {
      case 'message': {
        const event = wsMessage as ServerMessageEvent
        const newMsg = event.message
        if (newMsg.conversation_id !== conversationId) return

        // Deduplicate — sender already added optimistically
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        // Update sidebar last-message preview
        const preview: LastMessagePreview = {
          content: getTextContent(newMsg.content),
          sender_user_id: newMsg.sender_user_id ?? '',
          timestamp: newMsg.timestamp,
        }
        updateLastMessage(conversationId, preview)
        onSidebarUpdate?.(preview, conversationId)

        // Auto-mark as read (this is the active conversation)
        markConversationRead(conversationId)

        // Clear typing indicator for this sender
        if (newMsg.sender_user_id) {
          setTypingUsers((prev) =>
            prev.filter((tu) => tu.user_id !== newMsg.sender_user_id),
          )
          const senderTimeout = typingTimeoutsRef.current.get(newMsg.sender_user_id!)
          if (senderTimeout) {
            clearTimeout(senderTimeout)
            typingTimeoutsRef.current.delete(newMsg.sender_user_id!)
          }
        }
        break
      }

      case 'typing_start': {
        const event = wsMessage as TypingEvent
        if (event.conversation_id !== conversationId) return
        if (event.user_id === userId) return // Ignore own typing

        setTypingUsers((prev) => {
          if (prev.some((tu) => tu.user_id === event.user_id)) return prev
          return [...prev, { user_id: event.user_id, user_name: event.user_name }]
        })

        // Auto-clear after 3s in case typing_stop is missed
        const existing = typingTimeoutsRef.current.get(event.user_id)
        if (existing) clearTimeout(existing)

        const timeout = setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((tu) => tu.user_id !== event.user_id),
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
          prev.filter((tu) => tu.user_id !== event.user_id),
        )

        const timeout = typingTimeoutsRef.current.get(event.user_id)
        if (timeout) {
          clearTimeout(timeout)
          typingTimeoutsRef.current.delete(event.user_id)
        }
        break
      }
    }
  }, [wsMessage, conversationId, userId, onSidebarUpdate])

  // ── Cleanup typing timeouts on unmount or conversation change ──────────
  useEffect(() => {
    return () => {
      for (const timeout of typingTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      typingTimeoutsRef.current.clear()
    }
  }, [conversationId])

  // ── Load older messages (pagination) ───────────────────────────────────
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

  // ── Send message ───────────────────────────────────────────────────────
  const send = useCallback(
    async (content: string) => {
      if (!userId) return

      try {
        const message = await sendMessage({
          conversation_id: conversationId,
          sender_user_id: userId,
          content,
        })

        // Optimistic: add to local state immediately
        setMessages((prev) => [...prev, message])

        // Update conversation preview
        const preview: LastMessagePreview = {
          content: getTextContent(message.content),
          sender_user_id: message.sender_user_id ?? '',
          timestamp: message.timestamp,
        }
        updateLastMessage(conversationId, preview)
        onSidebarUpdate?.(preview, conversationId)
      } catch {
        // Error sending message — caller should handle with toast/retry
      }
    },
    [conversationId, userId, onSidebarUpdate],
  )

  // ── Typing indicator senders ───────────────────────────────────────────
  const sendTypingStart = useCallback(() => {
    if (!userId) return
    wsSend({
      type: 'typing_start',
      conversation_id: conversationId,
      user_id: userId,
      user_name: userId,
    })
  }, [conversationId, userId, wsSend])

  const sendTypingStop = useCallback(() => {
    if (!userId) return
    wsSend({
      type: 'typing_stop',
      conversation_id: conversationId,
      user_id: userId,
      user_name: userId,
    })
  }, [conversationId, userId, wsSend])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    typingUsers,
    wsStatus,
    loadMore,
    send,
    sendTypingStart,
    sendTypingStop,
    onSidebarUpdate,
    setOnSidebarUpdate,
  }
}
