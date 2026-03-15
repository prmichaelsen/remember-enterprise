/**
 * ToolCallBadge — inline pill that shows a tool invocation's name and status.
 * Renders between text chunks during streaming to give real-time feedback.
 */

import { Check, Loader2, X, Wrench } from 'lucide-react'
import { useTheme } from '@/lib/theming'

export interface ToolCallBadgeProps {
  name: string
  status: 'pending' | 'success' | 'error'
  id?: string
}

export function ToolCallBadge({ name, status, id }: ToolCallBadgeProps) {
  const t = useTheme()

  const badgeClass =
    status === 'pending'
      ? t.badgeInfo
      : status === 'success'
        ? t.badgeSuccess
        : t.badgeDanger

  const icon =
    status === 'pending' ? (
      <Loader2 size={12} className="animate-spin" />
    ) : status === 'success' ? (
      <Check size={12} />
    ) : (
      <X size={12} />
    )

  return (
    <span
      data-tool-id={id}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${badgeClass}`}
    >
      <Wrench size={10} className="opacity-60" />
      {icon}
      <span>{name}</span>
    </span>
  )
}
