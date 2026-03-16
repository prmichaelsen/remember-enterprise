/**
 * MessageList — virtualized scrollable list of messages.
 * Auto-scrolls to bottom on new messages. Supports loading older messages on scroll up.
 * Uses the Message component ported from agentbase.me.
 *
 * Streaming and typing indicators are synthetic items in the Virtuoso data array
 * (matching the agentbase.me approach) for proper scroll behavior.
 */

import { useRef, useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { Message as MessageType } from '@/types/conversations'
import type { StreamingBlock } from '@/types/streaming'
import { Message } from '@/components/chat/Message'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { ToolCallBadge } from '@/components/chat/ToolCallBadge'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { SaveMemoryButton } from '@/components/chat/SaveMemoryButton'
import { MemoryService } from '@/services/memory.service'
import { useActionToast } from '@/hooks/useActionToast'
import { getTextContent } from '@/lib/message-content'

interface MessageListProps {
  messages: MessageType[]
  conversationId: string
  currentUserId?: string
  canModerate?: boolean
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  typingUsers?: Array<{ user_id: string; user_name: string }>
  streamingBlocks?: StreamingBlock[]
  onReply?: (messageId: string, quotedContent: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onTogglePin?: (messageId: string) => void
  onReport?: (messageId: string) => void
  inputHeight?: number
}

export interface MessageListRef {
  scrollToBottom: () => void
  scrollToMessage: (messageId: string) => void
}

const START_INDEX = 100_000

type ListItem =
  | { type: 'message'; message: MessageType }
  | { type: 'streaming'; blocks: StreamingBlock[] }
  | { type: 'typing'; typingUsers: Array<{ user_id: string; user_name: string }> }

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList({
  messages,
  conversationId,
  currentUserId,
  canModerate = false,
  loading = false,
  hasMore = false,
  onLoadMore,
  typingUsers = [],
  streamingBlocks = [],
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onReport,
  inputHeight = 0,
}, ref) {
  const t = useTheme()
  const { user } = useAuth()
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [savedMemoryIds, setSavedMemoryIds] = useState<Map<string, string>>(new Map())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const { withToast } = useActionToast()

  // Build augmented items array with messages + synthetic streaming/typing entries
  const items = useMemo(() => {
    const result: ListItem[] = messages.map(m => ({ type: 'message' as const, message: m }))
    if (streamingBlocks.length > 0) {
      result.push({ type: 'streaming' as const, blocks: streamingBlocks })
    }
    if (typingUsers.length > 0 || loading) {
      result.push({ type: 'typing' as const, typingUsers })
    }
    return result
  }, [messages, streamingBlocks, typingUsers, loading])

  // Track firstItemIndex for prepend support
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX - items.length)

  useEffect(() => {
    setFirstItemIndex(START_INDEX - items.length)
  }, [items.length])

  // SSR guard — Virtuoso renders nothing server-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Manual scroll-to-bottom when streaming content changes
  // (followOutput only fires on item count changes, not content updates)
  useEffect(() => {
    if (atBottom && streamingBlocks.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: items.length - 1,
        align: 'end',
        behavior: 'auto',
      })
    }
  }, [streamingBlocks, atBottom, items.length])

  // Expose scrollToBottom and scrollToMessage methods to parent
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (items.length > 0) {
        virtuosoRef.current?.scrollToIndex({
          index: items.length - 1,
          align: 'end',
          behavior: 'auto',
        })
      }
    },
    scrollToMessage: (messageId: string) => {
      const index = messages.findIndex(m => m.id === messageId)
      if (index === -1) return
      virtuosoRef.current?.scrollToIndex({
        index,
        align: 'center',
        behavior: 'auto',
      })
      setTimeout(() => {
        const el = document.querySelector(`[data-message-id="${messageId}"]`)
        if (el) {
          el.classList.add('message-highlight')
          setTimeout(() => el.classList.remove('message-highlight'), 2000)
        }
      }, 100)
    },
  }), [items, messages])

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

  if (!isMounted) {
    return <div className="flex-1" />
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-0">
      <Virtuoso
        ref={virtuosoRef}
        className="flex-grow h-0"
        data={items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={items.length > 0 ? items.length - 1 : 0}
        startReached={() => {
          if (!isLoadingMore && hasMore && onLoadMore) {
            setIsLoadingMore(true)
            onLoadMore()
            setTimeout(() => setIsLoadingMore(false), 1000)
          }
        }}
        atBottomStateChange={setAtBottom}
        followOutput={(isAtBottom) => isAtBottom ? 'auto' : false}
        totalListHeightChanged={() => {
          if (atBottom) {
            virtuosoRef.current?.scrollToIndex({
              index: items.length - 1,
              align: 'end',
              behavior: 'auto',
            })
          }
        }}
        computeItemKey={(_index, item) => {
          if (item.type === 'message') return item.message.id
          if (item.type === 'streaming') return '__streaming__'
          return '__typing__'
        }}
        components={{
          Header: () =>
            isLoadingMore ? (
              <div className="flex justify-center py-4">
                <div className={`text-sm ${t.textMuted}`}>Loading older messages...</div>
              </div>
            ) : null,
          Footer: () => (
            <div style={{ paddingBottom: inputHeight > 0 ? `${inputHeight + 16}px` : '0' }} />
          ),
        }}
        itemContent={(_index, item) => {
          if (item.type === 'typing') {
            return (
              <div className="px-4">
                <TypingIndicator typingUsers={item.typingUsers} />
              </div>
            )
          }

          if (item.type === 'streaming') {
            return (
              <div className="group px-4 py-3">
                {/* Header: agent avatar + name + timestamp */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.elevated}`}>
                      <span className={`text-xs font-medium ${t.textSecondary}`}>A</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-sm font-medium ${t.textPrimary}`}>Agent</span>
                    <span className={`text-xs ${t.textMuted}`}>
                      {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
                {/* Content: interleaved text + tool_use blocks */}
                <div className="w-full break-words space-y-3">
                  {item.blocks.map((block, bi) => {
                    if (block.type === 'text') {
                      return <MarkdownContent key={`text-${bi}`} content={block.text} />
                    }
                    if (block.type === 'tool_use') {
                      return (
                        <ToolCallBadge
                          key={`tool-${block.id}`}
                          toolName={block.name}
                          status={block.status}
                          timestamp={new Date()}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )
          }

          // item.type === 'message'
          const message = item.message
          const displayContent = getTextContent(message.content)

          return (
            <div data-message-id={message.id}>
              <div className="relative">
                <Message
                  message={message}
                  currentUserId={currentUserId ?? user?.uid}
                  conversationId={conversationId}
                  canModerate={canModerate}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                  onReport={onReport}
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
})
