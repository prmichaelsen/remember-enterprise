import { useRef, useCallback } from 'react'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import type { ActionBarItem } from '@/types/action-bar'

export function useCopyActionBarItem(content: string): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const onTrigger = useCallback(() => {
    navigator.clipboard.writeText(content)
    showToast({ message: 'Copied to clipboard' })
  }, [content, showToast])

  return {
    key: 'copy',
    icon: Copy,
    label: 'Copy',
    onTrigger,
    triggerRef,
  }
}
