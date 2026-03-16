import { useRef, useCallback } from 'react'
import { Reply } from 'lucide-react'
import type { ActionBarItem } from '@/types/action-bar'

export function useReplyActionBarItem(
  messageId: string,
  content: string,
  onReply: (messageId: string, quotedContent: string) => void,
): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const onTrigger = useCallback(() => {
    onReply(messageId, content)
  }, [messageId, content, onReply])

  return {
    key: 'reply',
    icon: Reply,
    label: 'Reply',
    onTrigger,
    triggerRef,
  }
}
