/**
 * MemoryCard — card display for a single memory item.
 * Title, content preview (truncated), author, created_at, tags,
 * star rating display, click to expand.
 */

import { useState } from 'react'
import { Star, ChevronDown, ChevronUp, User, Clock } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import type { MemoryItem } from '@/types/memories'

interface MemoryCardProps {
  memory: MemoryItem
  /** Whether to show full content by default */
  defaultExpanded?: boolean
}

export function MemoryCard({ memory, defaultExpanded = false }: MemoryCardProps) {
  const t = useTheme()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const isLongContent = memory.content.length > 200
  const displayContent =
    isExpanded || !isLongContent
      ? memory.content
      : memory.content.slice(0, 200) + '...'

  return (
    <div
      className={`${t.card} p-4 transition-colors cursor-pointer hover:border-brand-primary/30`}
      onClick={() => isLongContent && setIsExpanded(!isExpanded)}
      role={isLongContent ? 'button' : undefined}
      tabIndex={isLongContent ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && isLongContent) setIsExpanded(!isExpanded)
      }}
    >
      {/* Header: title + rating */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          {memory.title && (
            <h3 className={`text-sm font-semibold ${t.textPrimary} truncate`}>
              {memory.title}
            </h3>
          )}
        </div>

        {/* Star rating */}
        {memory.rating !== null && (
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < (memory.rating ?? 0)
                    ? 'text-brand-warning fill-brand-warning'
                    : 'text-text-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <p
        className={`text-sm ${t.textSecondary} whitespace-pre-wrap break-words leading-relaxed`}
      >
        {displayContent}
      </p>

      {/* Expand indicator */}
      {isLongContent && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className={`flex items-center gap-1 text-xs ${t.buttonGhost} px-1 py-0.5 rounded mt-1`}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show more
            </>
          )}
        </button>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className={`${t.badgeDefault} text-xs px-2 py-0.5 rounded-full`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: author + timestamp + significance */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-1">
          <User className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-xs ${t.textMuted}`}>{memory.author_name}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-xs ${t.textMuted}`}>
            {formatDate(memory.created_at)}
          </span>
        </div>

        {memory.significance !== null && memory.significance > 0.7 && (
          <span className={`${t.badgeWarning} text-[10px] px-1.5 py-0.5 rounded-full ml-auto`}>
            high significance
          </span>
        )}

        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${t.badgeInfo}`}
        >
          {memory.scope}
        </span>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 1 ? 'just now' : `${diffMins}m ago`
    }
    return `${diffHours}h ago`
  }
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
