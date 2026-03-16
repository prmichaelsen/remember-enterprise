import { useRef, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmRenderer } from '@/components/action-bar/renderers/ConfirmRenderer'
import type { ActionBarItem, ActionBarContentContext } from '@/types/action-bar'

export function useDeleteActionBarItem(
  messageId: string,
  conversationId: string,
  isSender: boolean,
  canModerate: boolean,
  onDelete: (messageId: string) => void,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleConfirm = useCallback(() => {
    onDelete(messageId)
  }, [messageId, onDelete])

  const renderContent = useCallback(
    (ctx: ActionBarContentContext) => (
      <ConfirmRenderer
        text="Delete this message?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirm}
        close={ctx.close}
      />
    ),
    [handleConfirm],
  )

  return {
    key: 'delete',
    icon: Trash2,
    label: 'Delete',
    danger: true,
    hidden: !isSender && !canModerate,
    renderContent,
    triggerRef,
  }
}
