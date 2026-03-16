import { useRef, useCallback } from 'react'
import { BrandIcon } from '@/components/BrandIcon'
import { MemoryService } from '@/services/memory.service'
import { useActionToast } from '@/hooks/useActionToast'
import type { ActionBarItem } from '@/types/action-bar'

export function useSaveMemoryActionBarItem(
  content: string,
  conversationId: string,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { withToast } = useActionToast()

  const onTrigger = useCallback(() => {
    withToast(
      () => MemoryService.save({
        content,
        title: null,
        tags: [],
        scope: 'private',
        group_id: null,
        source_message_id: conversationId,
      }),
      {
        success: { title: 'Saved to memory' },
        error: { title: 'Failed to save memory' },
      },
    )
  }, [content, conversationId, withToast])

  return {
    key: 'save-memory',
    icon: BrandIcon,
    label: 'Save to memory',
    onTrigger,
    triggerRef,
  }
}
