import { useRef, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import type { ActionBarItem } from '@/types/action-bar'

export function useEditActionBarItem(
  messageId: string,
  isSender: boolean,
  onEdit: (messageId: string) => void,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const onTrigger = useCallback(() => {
    onEdit(messageId)
  }, [messageId, onEdit])

  return {
    key: 'edit',
    icon: Pencil,
    label: 'Edit',
    onTrigger,
    triggerRef,
    hidden: !isSender,
  }
}
