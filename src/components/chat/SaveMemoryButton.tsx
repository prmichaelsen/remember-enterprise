/**
 * SaveMemoryButton — bookmark icon on each chat message.
 * Hover-reveals on the message row; filled when the message has been saved.
 * Uses t.buttonGhost from the theme system.
 */

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useTheme } from '@/lib/theming'

interface SaveMemoryButtonProps {
  /** Message ID for duplicate detection */
  messageId: string
  /** Message content to pre-fill the save modal */
  messageContent: string
  /** Whether this message has already been saved as a memory */
  isSaved: boolean
  /** Callback to open the SaveMemoryModal */
  onSave: (messageId: string, content: string) => void
}

export function SaveMemoryButton({
  messageId,
  messageContent,
  isSaved,
  onSave,
}: SaveMemoryButtonProps) {
  const t = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  if (isSaved) {
    return (
      <button
        type="button"
        className={`p-1.5 rounded-md text-brand-primary cursor-default transition-colors`}
        title="Saved as memory"
        aria-label="Already saved as memory"
        disabled
      >
        <BookmarkCheck className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`p-1.5 rounded-md ${t.buttonGhost} opacity-0 group-hover:opacity-100 transition-all duration-150`}
      onClick={() => onSave(messageId, messageContent)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Save as memory"
      aria-label="Save message as memory"
    >
      {isHovered ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </button>
  )
}
