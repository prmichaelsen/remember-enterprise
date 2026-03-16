/**
 * MessageList — virtualized scrollable list of messages with avatars, timestamps, and role styling.
 * Auto-scrolls to bottom on new messages. Supports loading older messages on scroll up.
 */

import { useRef, useEffect, useCallback, useState, memo } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { Message } from '@/types/conversations'
import type { StreamingBlock } from '@/types/streaming'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { StreamingBlocks } from '@/components/chat/StreamingBlocks'
import { SaveMemoryButton } from '@/components/chat/SaveMemoryButton'
import { MemoryService } from '@/services/memory.service'
import { useActionToast } from '@/hooks/useActionToast'
import { getTextContent } from '@/lib/message-content'

interface MessageListProps {
  messages: Message[]
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

  const handleSaveMemory = useCallback(async (message: Message) => {
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

  function formatMessageTime(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  function getMessageStyle(message: Message): string {
    if (message.role === 'system') return t.messageSystem
    if (message.role === 'assistant') return t.messageAgent
    if (message.sender_user_id === user?.uid) return t.messageSelf
    return t.messageOther
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
          return (
            <MessageRow
              message={message}
              isSelf={message.sender_user_id === user?.uid}
              showDate={shouldShowDateDivider(arrayIndex)}
              messageStyle={getMessageStyle(message)}
              formatMessageTime={formatMessageTime}
              formatMessageDate={formatMessageDate}
              isSaved={savedMemoryIds.has(message.id)}
              onSave={() => handleSaveMemory(message)}
              t={t}
            />
          )
        }}
      />
    </div>
  )
}

interface MessageRowProps {
  message: Message
  isSelf: boolean
  showDate: boolean
  messageStyle: string
  formatMessageTime: (iso: string) => string
  formatMessageDate: (iso: string) => string
  isSaved: boolean
  onSave: () => void
  t: ReturnType<typeof useTheme>
}

const MessageRow = memo(function MessageRow({
  message,
  isSelf,
  showDate,
  messageStyle,
  formatMessageTime,
  formatMessageDate,
  isSaved,
  onSave,
  t,
}: MessageRowProps) {
  const displayContent = getTextContent(message.content)

  return (
    <div className="px-4">
      {/* Date divider */}
      {showDate && (
        <div className="flex items-center gap-3 py-3">
          <div className={`flex-1 h-px ${t.borderSubtle}`} style={{ borderWidth: 0, height: '1px', background: 'currentColor', opacity: 0.15 }} />
          <span className={`text-xs ${t.textMuted}`}>
            {formatMessageDate(message.timestamp)}
          </span>
          <div className={`flex-1 h-px ${t.borderSubtle}`} style={{ borderWidth: 0, height: '1px', background: 'currentColor', opacity: 0.15 }} />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`group flex gap-3 py-1.5 ${
          isSelf ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        {!isSelf && message.role !== 'system' && (
          <div className="shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${t.elevated}`}
            >
              <span className={`text-xs font-medium ${t.textSecondary}`}>
                {(message.sender_user_id ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
          {/* Sender info (for non-self, non-system messages) */}
          {!isSelf && message.role !== 'system' && (
            <p className={`text-xs font-medium mb-0.5 ${t.textSecondary}`}>
              {message.sender_user_id ?? 'Unknown'}
              {message.role === 'assistant' && (
                <span className={`ml-1.5 ${t.badgeInfo} px-1.5 py-0.5 rounded text-[10px]`}>
                  Agent
                </span>
              )}
            </p>
          )}

          <div
            className={`px-3 py-2 rounded-lg ${messageStyle}`}
          >
            {/* Message content */}
            <div className={`text-sm whitespace-pre-wrap break-words ${t.textPrimary}`}>
              {displayContent}
            </div>

            {/* Timestamp */}
            <p
              className={`text-[10px] mt-1 ${t.textMuted} ${
                isSelf ? 'text-right' : 'text-left'
              }`}
            >
              {formatMessageTime(message.timestamp)}
              {message.metadata?.edited && ' (edited)'}
            </p>
          </div>
        </div>

        {/* Save as memory button (non-system messages only) */}
        {message.role !== 'system' && (
          <div className="self-center shrink-0">
            <SaveMemoryButton
              messageId={message.id}
              messageContent={displayContent}
              isSaved={isSaved}
              onSave={onSave}
            />
          </div>
        )}
      </div>
    </div>
  )
})
