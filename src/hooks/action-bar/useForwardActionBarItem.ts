import { useRef, useCallback } from 'react'
import { Forward } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import type { ActionBarItem } from '@/types/action-bar'

export function useForwardActionBarItem(content: string): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const onTrigger = useCallback(() => {
    navigator.clipboard.writeText(content)
    showToast({ message: 'Message copied for forwarding' })
  }, [content, showToast])

  return {
    key: 'forward',
    icon: Forward,
    label: 'Forward',
    onTrigger,
    triggerRef,
  }
}
