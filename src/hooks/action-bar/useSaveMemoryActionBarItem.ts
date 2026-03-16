import { useRef, useCallback, useState } from 'react'
import { createElement } from 'react'
import { BookmarkPlus } from 'lucide-react'
import { SaveMemoryModal } from '@/components/chat/SaveMemoryModal'
import type { ActionBarItem } from '@/types/action-bar'

export function useSaveMemoryActionBarItem(
  content: string,
  conversationId: string,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const onTrigger = useCallback(() => {
    setIsOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const onSaved = useCallback(() => {
    setIsOpen(false)
  }, [])

  const renderModals = useCallback(
    () =>
      createElement(SaveMemoryModal, {
        isOpen,
        onClose,
        messageContent: content,
        sourceMessageId: conversationId,
        onSaved,
      }),
    [isOpen, onClose, content, conversationId, onSaved],
  )

  return {
    key: 'save-memory',
    icon: BookmarkPlus,
    label: 'Save to memory',
    onTrigger,
    triggerRef,
    renderModals,
  }
}
