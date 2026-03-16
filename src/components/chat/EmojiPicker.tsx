import { useTheme } from '@/lib/theming'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀', '🙏', '✅', '❌']

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const theme = useTheme()

  return (
    <div className="grid grid-cols-6 gap-1 p-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`text-lg p-1.5 rounded ${theme.hover} transition-colors`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
