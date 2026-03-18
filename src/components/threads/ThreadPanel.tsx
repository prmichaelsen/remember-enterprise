/**
 * ThreadPanel — Sidebar panel for viewing and replying to threaded conversations.
 * Desktop: resizable sidebar on right (320-800px, default 500px). Mobile: Full-screen overlay.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { X, Reply, ArrowLeft } from 'lucide-react'
import { MessageDatabaseService } from '@/services/message-database.service'
import type { Message, ConversationType } from '@/types/conversations'
import { Message as MessageComponent } from '@/components/chat/Message'
import { MessageCompose } from '@/components/chat/MessageCompose'
import type { ProfileSummary } from '@/lib/profile-map'
import { getTextContent } from '@/lib/message-content'

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 500
const STORAGE_KEY = 'thread-panel-width'

interface ThreadPanelProps {
  conversationId: string
  parentMessage: Message
  onClose: () => void
  userId: string
  conversationType?: ConversationType
  profiles?: Record<string, ProfileSummary>
  onSendReply: (content: string, parentMessageId: string) => void
  onTypingStart: () => void
  onTypingStop: () => void
}

export function ThreadPanel({
  conversationId,
  parentMessage,
  onClose,
  userId,
  conversationType,
  profiles = {},
  onSendReply,
  onTypingStart,
  onTypingStop,
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const virtuosoRef = useRef<any>(null)

  // Resize state
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const [isDesktop, setIsDesktop] = useState(false)
  const isResizingRef = useRef(false)
  const panelWidthRef = useRef(DEFAULT_WIDTH)

  // Sync ref with state
  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  // Restore width from localStorage and detect desktop on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDesktop(window.innerWidth >= 768)

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = parseInt(stored, 10)
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setPanelWidth(parsed)
          panelWidthRef.current = parsed
        }
      }
    } catch {
      // localStorage unavailable
    }

    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Drag-to-resize handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX))
    setPanelWidth(newWidth)
    panelWidthRef.current = newWidth
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isResizingRef.current) return
    isResizingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    try {
      localStorage.setItem(STORAGE_KEY, String(panelWidthRef.current))
    } catch {
      // localStorage unavailable
    }

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp])

  // Load initial thread replies
  useEffect(() => {
    async function loadReplies() {
      setLoading(true)
      try {
        const result = await MessageDatabaseService.listThreadReplies(
          conversationId,
          parentMessage.id,
          50,
          undefined,
          userId,
          conversationType
        )
        setReplies(result.messages)
        setHasMore(result.has_more)
      } catch (error) {
        console.error('Failed to load thread replies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReplies()
  }, [conversationId, parentMessage.id, userId, conversationType])

  // Add method to receive new replies from parent (called when WebSocket message arrives)
  useEffect(() => {
    // Expose addReply method via window for parent to call
    // This is a simple integration approach; can be improved with proper context
    const threadPanelId = `thread-${parentMessage.id}`
    ;(window as any)[threadPanelId] = {
      addReply: (message: Message) => {
        if (message.parent_message_id === parentMessage.id) {
          setReplies(prev => {
            // Deduplicate
            if (prev.some(m => m.id === message.id)) return prev
            return [...prev, message]
          })
          // Auto-scroll to bottom on new reply
          setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' })
          }, 100)
        }
      }
    }

    return () => {
      delete (window as any)[threadPanelId]
    }
  }, [parentMessage.id])

  function handleSendReply(content: string) {
    onSendReply(content, parentMessage.id)
  }

  return (
    <div
      className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 bg-background flex flex-col z-50 md:border-l md:border-border"
      id={`thread-panel-${parentMessage.id}`}
      style={isDesktop ? { width: `${panelWidth}px` } : undefined}
    >
      {/* Drag handle — desktop only */}
      <div
        className="hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize thread panel"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Mobile: back button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-muted rounded-md"
            aria-label="Back to chat"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Reply className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-semibold">Thread</div>
            <div className="text-sm text-muted-foreground">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
          </div>
        </div>

        {/* Desktop: close button */}
        <button
          onClick={onClose}
          className="hidden md:block p-2 hover:bg-muted rounded-md"
          aria-label="Close thread"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Parent message context */}
      <div className="p-4 bg-muted/50 border-b border-border">
        <MessageComponent
          message={parentMessage}
          currentUserId={userId}
          conversationId={conversationId}
          senderProfile={profiles[parentMessage.sender_user_id ?? '']}
          conversationType={conversationType}
        />
      </div>

      {/* Thread replies */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading thread...</div>
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Reply className="h-12 w-12 mb-4 opacity-50" />
            <div>No replies yet</div>
            <div className="text-sm">Be the first to reply</div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={replies}
            itemContent={(index, message) => (
              <div className="px-4 py-2" key={message.id}>
                <MessageComponent
                  message={message}
                  currentUserId={userId}
                  conversationId={conversationId}
                  senderProfile={profiles[message.sender_user_id ?? '']}
                  conversationType={conversationType}
                />
              </div>
            )}
          />
        )}
      </div>

      {/* Compose box */}
      <div className="border-t border-border">
        {/* Thread reply banner */}
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
          <Reply className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-muted-foreground">
              Replying to:{' '}
            </span>
            <span className="text-sm text-foreground/80 truncate inline-block max-w-full">
              "{getTextContent(parentMessage.content).substring(0, 80)}
              {getTextContent(parentMessage.content).length > 80 ? '...' : ''}"
            </span>
          </div>
        </div>

        <div className="p-4">
          <MessageCompose
            conversationId={conversationId}
            senderId={userId}
            onSend={handleSendReply}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
          />
        </div>
      </div>
    </div>
  )
}
