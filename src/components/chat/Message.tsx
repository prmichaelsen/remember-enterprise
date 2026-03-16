import { memo, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { ToolCallBadge } from './ToolCallBadge'
import { ReactionDisplay } from './ReactionDisplay'
import { ActionBar } from '@/components/action-bar/ActionBar'
import { useMessageActionBarItems } from '@/hooks/action-bar/useMessageActionBarItems'
import { useMessageOverflowItems } from '@/hooks/action-bar/useMessageOverflowItems'
import { useReactActionBarItem } from '@/hooks/action-bar/useReactActionBarItem'
import { getTextContent } from '@/lib/message-content'
import type { Message as MessageType, MessageContent, ContentBlock } from '@/types/conversations'
import type { ProfileSummary } from '@/lib/profile-map'

interface MessageProps {
  message: MessageType
  currentUserId?: string
  conversationId?: string
  canModerate?: boolean
  senderProfile?: ProfileSummary | null
  ghostOwner?: string
  onReply?: (messageId: string, quotedContent: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onTogglePin?: (messageId: string) => void
  onReport?: (messageId: string) => void
}

export const Message = memo(function Message({
  message,
  currentUserId,
  conversationId,
  canModerate = false,
  senderProfile,
  ghostOwner,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onReport,
}: MessageProps) {
  const isUser = message.sender_user_id ? message.sender_user_id === currentUserId : message.role === 'user'
  const isAssistant = message.role === 'assistant' && !message.sender_user_id
  const displayName = isUser
    ? 'You'
    : isAssistant
    ? 'Agent'
    : senderProfile?.display_name || senderProfile?.username || 'User'

  const handleReactionToggle = useCallback(
    async (emoji: string) => {
      if (!conversationId) return
      try {
        await fetch(`/api/messages/${message.id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji, conversation_id: conversationId }),
        })
      } catch {
        // silent fail — reactions are non-critical
      }
    },
    [message.id, conversationId],
  )

  const isSystem = message.role === 'system'
  const isGhostMessage = !!ghostOwner && message.role === 'assistant'

  // Action bar hooks — called unconditionally (React rules of hooks)
  const noopReply = useCallback((_id: string, _content: string) => {}, [])
  const noopEdit = useCallback((_id: string) => {}, [])
  const noopDelete = useCallback((_id: string) => {}, [])
  const noopTogglePin = useCallback((_id: string) => {}, [])
  const noopReport = useCallback((_id: string) => {}, [])

  const primaryItems = useMessageActionBarItems({
    message,
    currentUserId: currentUserId ?? '',
    conversationId: conversationId ?? '',
    onReply: onReply ?? noopReply,
    onEdit: onEdit ?? noopEdit,
  })
  const reactItem = useReactActionBarItem(message.id, conversationId ?? '')
  const overflowItem = useMessageOverflowItems({
    message,
    conversationId: conversationId ?? '',
    currentUserId: currentUserId ?? '',
    canModerate,
    onDelete: onDelete ?? noopDelete,
    onTogglePin: onTogglePin ?? noopTogglePin,
    onReport: onReport ?? noopReport,
  })

  if (isSystem) {
    const textContent = getTextContent(message.content)
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
          {textContent}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative px-4 py-3 ${isGhostMessage ? 'bg-purple-900/30 border-l-2 border-purple-500/20' : isUser ? 'bg-blue-900/20' : 'bg-slate-800/30'} hover:bg-gray-800/60 transition-colors`}
    >
      {/* Header row with avatar, name, timestamp */}
      <div className="flex items-center gap-3 mb-3 relative">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-600 text-white">
              {(senderProfile?.display_name ?? 'U').charAt(0).toUpperCase()}
            </div>
          ) : isGhostMessage ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-purple-600 text-white">
              G
            </div>
          ) : isAssistant ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-emerald-600 text-white">
              A
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-purple-600 text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name, timestamp, and metadata */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-sm font-medium ${isGhostMessage ? 'text-purple-300' : 'text-gray-200'}`}>
            {isGhostMessage ? 'Ghost' : displayName}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
            <span className="text-gray-500 ml-2">
              {(() => {
                const date = new Date(message.timestamp)
                const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
                const month = date.getMonth() + 1
                const day = date.getDate()
                const year = date.getFullYear().toString().slice(-2)
                return `${weekday} ${month}/${day}/${year}`
              })()}
            </span>
          </span>
          {message.metadata?.edited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
          {message.metadata?.regenerated && (
            <span className="text-xs text-gray-400">(regenerated)</span>
          )}
          {message.visible_to_user_ids && message.visible_to_user_ids.length > 0 && (
            <span className="text-xs text-purple-400">Visible only to you</span>
          )}
        </div>
      </div>

      {/* Content area - full width */}
      <div className="w-full break-words">
        {message.cancelled ? (
          <div className="relative">
            <div
              className="opacity-60"
              style={{
                maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              }}
            >
              <MessageContentDisplay content={message.content} />
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700/60 text-gray-400">
                Cancelled
              </span>
            </div>
          </div>
        ) : (
          <MessageContentDisplay content={message.content} />
        )}

        {/* Tool calls (legacy metadata format) */}
        {message.metadata?.tool_calls && message.metadata.tool_calls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.metadata.tool_calls.map((tool) => (
              <div
                key={tool.id}
                className="text-xs bg-gray-800/50 border border-gray-700 rounded p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-400">{tool.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      tool.status === 'completed'
                        ? 'bg-green-900/30 text-green-400'
                        : tool.status === 'failed'
                        ? 'bg-red-900/30 text-red-400'
                        : tool.status === 'executing'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
                {tool.error && (
                  <div className="mt-1 text-red-400">{tool.error}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {message.metadata?.error && (
          <div className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded p-3">
            <div className="font-medium mb-1">Error</div>
            <div>{message.metadata.error}</div>
          </div>
        )}

        {/* Reactions */}
        {message.metadata?.reactions && currentUserId && (
          <ReactionDisplay
            reactions={message.metadata.reactions}
            currentUserId={currentUserId}
            onToggle={handleReactionToggle}
          />
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-1">
        <ActionBar items={[...primaryItems, reactItem, overflowItem]} layout="compact" />
      </div>
    </div>
  )
})

/**
 * Render message content (text-only or mixed content blocks)
 */
function MessageContentDisplay({ content }: { content: MessageContent }) {
  if (typeof content === 'string') {
    return <MarkdownContent content={content} className="text-sm" />
  }

  return (
    <div className="space-y-3">
      {content.map((block, index) => {
        if (block.type === 'text') {
          return <MarkdownContent key={index} content={block.text} className="text-sm" />
        }

        if (block.type === 'image') {
          return (
            <img
              key={index}
              src={`data:${block.source.media_type};base64,${block.source.data}`}
              alt="User uploaded image"
              className="max-w-[320px] rounded-lg"
            />
          )
        }

        if (block.type === 'storage_image') {
          return (
            <img
              key={index}
              src={block.source.signedUrl}
              alt="Chat image"
              className="max-w-[320px] rounded-lg"
            />
          )
        }

        if (block.type === 'storage_file') {
          const fileName = block.source?.fileName || 'File'
          const fileSize = block.source?.fileSize
          return (
            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 max-w-[280px]">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-300 truncate">{fileName}</span>
              {fileSize != null && (
                <span className="text-xs text-gray-500 shrink-0">
                  {fileSize < 1024 ? `${fileSize} B` : fileSize < 1024 * 1024 ? `${(fileSize / 1024).toFixed(1)} KB` : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`}
                </span>
              )}
            </div>
          )
        }

        if (block.type === 'tool_use') {
          return (
            <ToolCallBadge
              key={`tool-${block.id}`}
              toolName={block.name}
              status="success"
              timestamp={new Date()}
            />
          )
        }

        return null
      })}
    </div>
  )
}
