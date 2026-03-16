/**
 * MessageBubble — renders a single message with avatar, sender name,
 * timestamp, and content. Uses themed styles for own vs received messages.
 * Supports optimistic (pending) styling.
 */

import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { Message } from '@/types/conversations'
import { Clock } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { getTextContent } from '@/lib/message-content'

export interface MessageBubbleProps {
  message: Message
  /** Whether this message is optimistically rendered and awaiting server confirmation */
  pending?: boolean
}

export function MessageBubble({
  message,
  pending = false,
}: MessageBubbleProps) {
  const t = useTheme()
  const { user } = useAuth()

  const isSelf = message.sender_user_id === user?.uid
  const displayContent = getTextContent(message.content)

  function getMessageStyle(): string {
    if (message.role === 'system') return t.messageSystem
    if (message.role === 'assistant') return t.messageAgent
    if (isSelf) return t.messageSelf
    return t.messageOther
  }

  function formatMessageTime(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`flex gap-3 py-1.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'} ${
        pending ? 'opacity-60' : ''
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
        {/* Sender name (for non-self, non-system messages) */}
        {!isSelf && message.role !== 'system' && (
          <p className={`text-xs font-medium mb-0.5 ${t.textSecondary}`}>
            {message.sender_user_id ?? 'Unknown'}
            {message.role === 'assistant' && (
              <span
                className={`ml-1.5 ${t.badgeInfo} px-1.5 py-0.5 rounded text-[10px]`}
              >
                Agent
              </span>
            )}
          </p>
        )}

        <div className={`px-3 py-2 rounded-lg ${getMessageStyle()}`}>
          {/* Message content */}
          <MarkdownContent
            content={displayContent}
            className={`text-sm break-words ${t.textPrimary}`}
          />

          {/* Timestamp + pending indicator */}
          <p
            className={`text-[10px] mt-1 ${t.textMuted} ${
              isSelf ? 'text-right' : 'text-left'
            } flex items-center gap-1 ${isSelf ? 'justify-end' : 'justify-start'}`}
          >
            {pending && <Clock className="w-2.5 h-2.5 inline-block" />}
            {pending ? 'Sending...' : formatMessageTime(message.timestamp)}
            {!pending && message.metadata?.edited && ' (edited)'}
          </p>
        </div>
      </div>
    </div>
  )
}
