import { useRef, useCallback } from 'react'
import { Flag } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmRenderer } from '@/components/action-bar/renderers/ConfirmRenderer'
import type { ActionBarItem, ActionBarContentContext } from '@/types/action-bar'

export function useReportActionBarItem(
  messageId: string,
  isSender: boolean,
  onReport: (messageId: string) => void,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const handleConfirm = useCallback(() => {
    onReport(messageId)
    showToast({ message: 'Message reported' })
  }, [messageId, onReport, showToast])

  const renderContent = useCallback(
    (ctx: ActionBarContentContext) => (
      <ConfirmRenderer
        text="Report this message to moderators?"
        confirmLabel="Report"
        variant="danger"
        onConfirm={handleConfirm}
        close={ctx.close}
      />
    ),
    [handleConfirm],
  )

  return {
    key: 'report',
    icon: Flag,
    label: 'Report',
    hidden: isSender,
    renderContent,
    triggerRef,
  }
}
