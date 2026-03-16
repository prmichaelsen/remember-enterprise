import { useRef, useCallback } from 'react'
import { SmilePlus } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { EmojiPicker } from '@/components/chat/EmojiPicker'
import { createElement } from 'react'
import type { ActionBarItem, ActionBarContentContext } from '@/types/action-bar'

export function useReactActionBarItem(
  messageId: string,
  conversationId: string,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const handleSelect = useCallback(
    async (emoji: string, close: () => void) => {
      close()
      try {
        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji, conversation_id: conversationId }),
        })
        if (!res.ok) {
          throw new Error('Failed to toggle reaction')
        }
        showToast({ message: `Reacted with ${emoji}`, duration: 1500 })
      } catch {
        showToast({ message: 'Failed to react', variant: 'error' })
      }
    },
    [messageId, conversationId, showToast],
  )

  return {
    key: 'react',
    icon: SmilePlus,
    label: 'React',
    renderContent: (ctx: ActionBarContentContext) =>
      createElement(EmojiPicker, {
        onSelect: (emoji: string) => handleSelect(emoji, ctx.close),
      }),
    triggerRef,
  }
}
