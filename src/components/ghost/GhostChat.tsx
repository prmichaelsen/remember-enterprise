/**
 * GhostChat — chat interface for AI persona conversations.
 * Uses t.messageAgent styling, streaming responses with typing indicator
 * and progressive rendering.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Ghost, Loader2, ArrowDown } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import {
  GhostService,
  type GhostConversation,
  type GhostMessage,
  type GhostPersona,
} from '@/services/ghost.service'

interface GhostChatProps {
  ghost: GhostPersona
}

export function GhostChat({ ghost }: GhostChatProps) {
  const t = useTheme()

  const [conversation, setConversation] = useState<GhostConversation | null>(null)
  const [messages, setMessages] = useState<GhostMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load or create conversation on ghost select
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    GhostService.getOrCreateConversation(ghost.id)
      .then((conv) => {
        setConversation(conv)
        setMessages(conv.messages)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [ghost.id])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Focus input on load
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  const handleSend = useCallback(async () => {
    const content = inputValue.trim()
    if (!content || !conversation || isSending) return

    setInputValue('')
    setIsSending(true)
    setIsStreaming(true)
    setStreamingContent('')

    // Optimistic user message
    const userMessage: GhostMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      await GhostService.sendMessageStreaming(
        conversation.id,
        content,
        {
          onChunk: (chunk) => {
            setStreamingContent((prev) => prev + chunk)
          },
          onComplete: (fullContent) => {
            setIsStreaming(false)
            setStreamingContent('')
            const assistantMessage: GhostMessage = {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: fullContent,
              createdAt: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMessage])
          },
          onError: (errMsg) => {
            setIsStreaming(false)
            setStreamingContent('')
            setError(errMsg)
          },
        },
      )
    } catch (err) {
      setIsStreaming(false)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }, [inputValue, conversation, isSending])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className={`w-6 h-6 animate-spin ${t.textMuted}`} />
      </div>
    )
  }

  if (error && !conversation) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-brand-danger text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Ghost header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center">
          {ghost.avatarUrl ? (
            <img
              src={ghost.avatarUrl}
              alt={ghost.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Ghost className="w-4 h-4 text-brand-accent" />
          )}
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${t.textPrimary}`}>
            {ghost.name}
          </h3>
          <p className={`text-xs ${t.textMuted}`}>{ghost.description}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-12">
            <Ghost className={`w-10 h-10 ${t.textMuted} mb-3`} />
            <p className={`text-sm ${t.textMuted} text-center`}>
              Start a conversation with {ghost.name}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} ghostName={ghost.name} />
        ))}

        {/* Streaming response */}
        {isStreaming && (
          <div className={`${t.messageAgent} rounded-lg p-3 max-w-[85%]`}>
            <div className="flex items-center gap-2 mb-1">
              <Ghost className="w-3.5 h-3.5 text-brand-accent" />
              <span className={`text-xs font-medium ${t.textMuted}`}>
                {ghost.name}
              </span>
            </div>
            {streamingContent ? (
              <p className={`text-sm ${t.textSecondary} whitespace-pre-wrap`}>
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-brand-accent/50 animate-pulse ml-0.5" />
              </p>
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 text-xs text-brand-danger bg-brand-danger/5 border-t border-brand-danger/20">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border-default p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${ghost.name}...`}
            rows={1}
            className={`flex-1 resize-none px-3 py-2.5 rounded-lg ${t.input} ${t.inputFocus} outline-none transition-colors max-h-32`}
            style={{ minHeight: '42px' }}
            disabled={isSending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={`p-2.5 rounded-lg ${t.buttonPrimary} transition-colors disabled:opacity-50`}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Individual message bubble */
function MessageBubble({
  message,
  ghostName,
}: {
  message: GhostMessage
  ghostName: string
}) {
  const t = useTheme()
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`rounded-lg p-3 max-w-[85%] ${
          isUser ? t.messageSelf : t.messageAgent
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Ghost className="w-3 h-3 text-brand-accent" />
            <span className={`text-xs font-medium ${t.textMuted}`}>
              {ghostName}
            </span>
          </div>
        )}
        <p
          className={`text-sm ${t.textSecondary} whitespace-pre-wrap break-words`}
        >
          {message.content}
        </p>
        <p className={`text-[10px] ${t.textMuted} mt-1`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

/** Typing indicator — three animated dots */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span
        className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}
