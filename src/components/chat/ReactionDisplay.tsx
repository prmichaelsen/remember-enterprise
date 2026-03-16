import { useTheme } from '@/lib/theming'

interface ReactionDisplayProps {
  reactions: Record<string, string[]>
  currentUserId: string
  onToggle: (emoji: string) => void
}

export function ReactionDisplay({ reactions, currentUserId, onToggle }: ReactionDisplayProps) {
  const theme = useTheme()
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0)

  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, userIds]) => {
        const isActive = userIds.includes(currentUserId)
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
              isActive
                ? 'bg-brand-primary/20 border-brand-primary/50 text-text-primary'
                : 'bg-bg-elevated border-border-subtle text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {emoji} {userIds.length}
          </button>
        )
      })}
    </div>
  )
}
