/**
 * MessageList — virtualized scrollable list of messages.
 * Auto-scrolls to bottom on new messages. Supports loading older messages on scroll up.
 * Uses the Message component ported from agentbase.me.
 */

import { useRef, useEffect, useCallback, useState, memo } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { Message as MessageType } from '@/types/conversations'
import type { StreamingBlock } from '@/types/streaming'
import { Message } from '@/components/chat/Message'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { StreamingBlocks } from '@/components/chat/StreamingBlocks'
import { SaveMemoryButton } from '@/components/chat/SaveMemoryButton'
import { MemoryService } from '@/services/memory.service'
import { useActionToast } from '@/hooks/useActionToast'
import { getTextContent } from '@/lib/message-content'

interface MessageListProps {
  messages: MessageType[]
  conversationId: string
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  typingUsers?: Array<{ user_id: string; user_name: string }>
  streamingBlocks?: StreamingBlock[]
}

const START_INDEX = 100_000

export function MessageList({
  messages,
  conversationId,
  loading = false,
  hasMore = false,
  onLoadMore,
  typingUsers = [],
  streamingBlocks = [],
}: MessageListProps) {
  const t = useTheme()
  const { user } = useAuth()
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [atBottom, setAtBottom] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [savedMemoryIds, setSavedMemoryIds] = useState<Map<string, string>>(new Map())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const { withToast } = useActionToast()
  const prevFirstIdRef = useRef<string | null>(null)
  const prevConversationIdRef = useRef(conversationId)

  // SSR guard — Virtuoso renders nothing server-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset firstItemIndex when conversation changes
  useEffect(() => {
    if (prevConversationIdRef.current !== conversationId) {
      prevConversationIdRef.current = conversationId
      setFirstItemIndex(START_INDEX)
      prevFirstIdRef.current = null
    }
  }, [conversationId])

  // Detect prepended messages and adjust firstItemIndex
  useEffect(() => {
    if (messages.length === 0) {
      prevFirstIdRef.current = null
      return
    }
    const currentFirstId = messages[0].id
    if (prevFirstIdRef.current !== null && prevFirstIdRef.current !== currentFirstId) {
      const oldIndex = messages.findIndex((m) => m.id === prevFirstIdRef.current)
      if (oldIndex > 0) {
        setFirstItemIndex((prev) => prev - oldIndex)
      }
    }
    prevFirstIdRef.current = currentFirstId
  }, [messages])

  const handleSaveMemory = useCallback(async (message: MessageType) => {
    if (savingIds.has(message.id)) return
    setSavingIds((prev) => new Set(prev).add(message.id))
    try {
      const result = await withToast(
        () => MemoryService.save({
          content: getTextContent(message.content),
          title: null,
          tags: [],
          scope: 'personal',
          group_id: null,
          source_message_id: message.id,
        }),
        {
          success: { title: 'Memory saved' },
          error: { title: 'Save failed', message: 'Could not save memory.' },
        },
      )
      if (result) {
        const memoryId = result.memory.id
        setSavedMemoryIds((prev) => new Map(prev).set(message.id, memoryId))
      }
    } finally {
      setSavingIds((prev) => { const next = new Set(prev); next.delete(message.id); return next })
    }
  }, [conversationId, savingIds, withToast])

  function formatMessageDate(iso: string): string {
    const date = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  function shouldShowDateDivider(arrayIndex: number): boolean {
    if (arrayIndex === 0) return true
    const prev = new Date(messages[arrayIndex - 1].timestamp).toDateString()
    const curr = new Date(messages[arrayIndex].timestamp).toDateString()
    return prev !== curr
  }

  if (!isMounted) {
    return <div className="flex-1" />
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-0">
      <Virtuoso
        ref={virtuosoRef}
        className="flex-grow h-0"
        data={messages}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
        startReached={() => {
          if (hasMore && !loading && onLoadMore) onLoadMore()
        }}
        atBottomStateChange={setAtBottom}
        followOutput={(isAtBottom) => isAtBottom ? 'smooth' : false}
        computeItemKey={(_index, msg) => msg.id}
        components={{
          Header: () =>
            loading ? (
              <div className="flex justify-center py-4">
                <div className={`text-sm ${t.textMuted}`}>Loading messages...</div>
              </div>
            ) : null,
          Footer: () => (
            <div className="px-4">
              {streamingBlocks.length > 0 && (
                <StreamingBlocks blocks={streamingBlocks} />
              )}
              <TypingIndicator typingUsers={typingUsers} />
            </div>
          ),
        }}
        itemContent={(index, message) => {
          const arrayIndex = index - firstItemIndex
          const showDate = shouldShowDateDivider(arrayIndex)
          const displayContent = getTextContent(message.content)

          return (
            <div>
              {/* Date divider */}
              {showDate && (
                <div className="flex items-center gap-3 py-3 px-4">
                  <div className={`flex-1 h-px ${t.borderSubtle}`} style={{ borderWidth: 0, height: '1px', background: 'currentColor', opacity: 0.15 }} />
                  <span className={`text-xs ${t.textMuted}`} style={{ background: 'transparent' }}>
                    {formatMessageDate(message.timestamp)}
                  </span>
                  <div className={`flex-1 h-px ${t.borderSubtle}`} style={{ borderWidth: 0, height: '1px', background: 'currentColor', opacity: 0.15 }} />
                </div>
              )}

              <div className="relative">
                <Message
                  message={message}
                  currentUserId={user?.uid}
                  conversationId={conversationId}
                />

                {/* Save as memory button */}
                {message.role !== 'system' && (
                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <SaveMemoryButton
                      messageId={message.id}
                      messageContent={displayContent}
                      isSaved={savedMemoryIds.has(message.id)}
                      onSave={() => handleSaveMemory(message)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
