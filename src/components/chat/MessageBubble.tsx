/**
 * MessageBubble — renders a single message with avatar, sender name,
 * timestamp, content, and attachments. Uses themed styles for own vs
 * received messages. Supports optimistic (pending) styling.
 */

import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import type { Message, MessageAttachment } from '@/types/conversations'
import { isImageType, formatFileSize } from '@/services/upload.service'
import { Download, Maximize2, Clock } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'

export interface MessageBubbleProps {
  message: Message
  /** Whether this message is optimistically rendered and awaiting server confirmation */
  pending?: boolean
  onExpandImage?: (url: string) => void
}

export function MessageBubble({
  message,
  pending = false,
  onExpandImage,
}: MessageBubbleProps) {
  const t = useTheme()
  const { user } = useAuth()

  const isSelf = message.sender_id === user?.uid

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

  function renderAttachments(attachments: MessageAttachment[]) {
    if (attachments.length === 0) return null

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment) => {
          if (isImageType(attachment.type)) {
            return (
              <div key={attachment.id} className="relative group">
                <img
                  src={attachment.thumbnail_url ?? attachment.url}
                  alt={attachment.name}
                  className="max-w-xs rounded-lg cursor-pointer"
                  onClick={() => onExpandImage?.(attachment.url)}
                />
                <button
                  type="button"
                  onClick={() => onExpandImage?.(attachment.url)}
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )
          }

          return (
            <a
              key={attachment.id}
              href={attachment.url}
              download={attachment.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t.elevated} ${t.hover} transition-colors`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className={`text-sm truncate ${t.textPrimary}`}>
                  {attachment.name}
                </p>
                <p className={`text-xs ${t.textMuted}`}>
                  {formatFileSize(attachment.size)}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    )
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
          {message.sender_photo_url ? (
            <img
              src={message.sender_photo_url}
              alt={message.sender_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${t.elevated}`}
            >
              <span className={`text-xs font-medium ${t.textSecondary}`}>
                {message.sender_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for non-self, non-system messages) */}
        {!isSelf && message.role !== 'system' && (
          <p className={`text-xs font-medium mb-0.5 ${t.textSecondary}`}>
            {message.sender_name}
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
            content={message.content}
            className={`text-sm break-words ${t.textPrimary}`}
          />

          {/* Attachments */}
          {renderAttachments(message.attachments)}

          {/* Timestamp + pending indicator */}
          <p
            className={`text-[10px] mt-1 ${t.textMuted} ${
              isSelf ? 'text-right' : 'text-left'
            } flex items-center gap-1 ${isSelf ? 'justify-end' : 'justify-start'}`}
          >
            {pending && <Clock className="w-2.5 h-2.5 inline-block" />}
            {pending ? 'Sending...' : formatMessageTime(message.created_at)}
            {!pending && message.updated_at && ' (edited)'}
          </p>
        </div>
      </div>
    </div>
  )
}
