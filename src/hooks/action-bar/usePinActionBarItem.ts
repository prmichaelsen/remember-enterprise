import { useRef, useCallback } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import type { ActionBarItem } from '@/types/action-bar'

export function usePinActionBarItem(
  messageId: string,
  isPinned: boolean,
  onTogglePin: (messageId: string) => void,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const onTrigger = useCallback(() => {
    onTogglePin(messageId)
    showToast({ message: isPinned ? 'Message unpinned' : 'Message pinned' })
  }, [messageId, isPinned, onTogglePin, showToast])

  return {
    key: 'pin',
    icon: isPinned ? PinOff : Pin,
    label: isPinned ? 'Unpin' : 'Pin',
    active: isPinned,
    onTrigger,
    triggerRef,
  }
}
