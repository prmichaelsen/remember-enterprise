import { getTextContent } from '@/lib/message-content'
import type { Message } from '@/types/conversations'
import type { ActionBarItem } from '@/types/action-bar'
import { useCopyActionBarItem } from './useCopyActionBarItem'
import { useEditActionBarItem } from './useEditActionBarItem'
import { useSaveMemoryActionBarItem } from './useSaveMemoryActionBarItem'
import { useReplyInThreadActionBarItem } from './useReplyInThreadActionBarItem'
import { useCopyThreadLinkActionBarItem } from './useCopyThreadLinkActionBarItem'

export function useMessageActionBarItems(opts: {
  message: Message
  currentUserId: string
  conversationId: string
  onEdit: (messageId: string) => void
  onOpenThread?: (message: Message) => void
}): ActionBarItem[] {
  const { message, currentUserId, conversationId, onEdit, onOpenThread } = opts
  const textContent = getTextContent(message.content)
  const isSender = message.sender_user_id === currentUserId

  const copyItem = useCopyActionBarItem(textContent)
  const editItem = useEditActionBarItem(message.id, isSender, onEdit)
  const saveMemoryItem = useSaveMemoryActionBarItem(textContent, conversationId)
  const copyThreadLinkItem = useCopyThreadLinkActionBarItem(message, conversationId)

  const items = [copyItem, editItem, saveMemoryItem]

  // Add "Reply in thread" action if callback provided and message is top-level
  if (onOpenThread && !message.parent_message_id) {
    const replyInThreadItem = useReplyInThreadActionBarItem(message, onOpenThread)
    items.splice(1, 0, replyInThreadItem) // Insert after copy, before edit
  }

  // Add "Copy link" action if this is a thread reply
  if (message.parent_message_id) {
    items.splice(1, 0, copyThreadLinkItem) // Insert after copy
  }

  return items
}
