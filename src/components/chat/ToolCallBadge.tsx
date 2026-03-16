import { memo } from 'react'

interface ToolCallBadgeProps {
  toolName: string
  status: 'pending' | 'success' | 'error'
  timestamp: Date | string
  onClick?: () => void
}

/**
 * ToolCallBadge — inline pill showing tool invocation name and status.
 * Ported from agentbase.me.
 */
export const ToolCallBadge = memo(function ToolCallBadge({
  toolName,
  status,
  timestamp,
  onClick,
}: ToolCallBadgeProps) {
  const statusColors = {
    pending: 'bg-blue-900/10 text-blue-400 border-blue-800/30',
    success: 'bg-green-900/10 text-green-400 border-green-800/30',
    error: 'bg-red-900/10 text-red-400 border-red-800/30',
  }

  const statusIcons = {
    pending: (
      <svg
        className="w-3 h-3 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
    success: (
      <svg
        className="w-3 h-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-3 h-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        border ${statusColors[status]}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        transition-opacity
      `}
      title={`${toolName} - ${status} at ${
        timestamp instanceof Date
          ? timestamp.toLocaleTimeString()
          : new Date(timestamp).toLocaleTimeString()
      }`}
      type="button"
    >
      {statusIcons[status]}
      <span className="font-mono">{toolName}</span>
    </button>
  )
})
