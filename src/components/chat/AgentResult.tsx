/**
 * AgentResult — inline tool result rendering for MCP agent responses.
 * Uses t.messageAgent theme styling. Simplified MessageCard with
 * title, content preview, and action buttons.
 */

import { useState } from 'react'
import { Bot, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react'
import { useTheme } from '@/lib/theming'

interface AgentResultProps {
  /** Tool name that was invoked */
  toolName: string
  /** Result content (may be long / JSON) */
  content: string
  /** Whether the response is still streaming */
  isStreaming?: boolean
  /** Raw structured output for advanced rendering */
  rawOutput?: unknown
  /** Status of the tool execution */
  status: 'pending' | 'success' | 'error'
}

export function AgentResult({
  toolName,
  content,
  isStreaming = false,
  status,
}: AgentResultProps) {
  const t = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const isLongContent = content.length > 300
  const displayContent =
    isExpanded || !isLongContent ? content : content.slice(0, 300) + '...'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className={`${t.messageAgent} rounded-lg p-4 my-2`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-brand-accent" />
        </div>
        <span className={`text-sm font-medium ${t.textPrimary}`}>
          {formatToolName(toolName)}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-xs text-brand-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            streaming
          </span>
        )}
        {status === 'error' && (
          <span className="text-xs text-brand-danger font-medium">error</span>
        )}
        {status === 'pending' && (
          <span className="text-xs text-text-muted">running...</span>
        )}
      </div>

      {/* Content */}
      <div className={`text-sm ${t.textSecondary} whitespace-pre-wrap break-words`}>
        {isStreaming && !content ? (
          <TypingIndicator />
        ) : (
          displayContent
        )}
      </div>

      {/* Expand / Actions */}
      <div className="flex items-center gap-2 mt-3">
        {isLongContent && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1 text-xs ${t.buttonGhost} px-2 py-1 rounded-md`}
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

        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 text-xs ${t.buttonGhost} px-2 py-1 rounded-md`}
          title="Copy to clipboard"
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * Typing indicator — three animated dots for streaming state.
 */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

/**
 * Convert tool_name to human-readable format.
 * "remember_search" -> "Remember Search"
 */
function formatToolName(name: string): string {
  return name
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
