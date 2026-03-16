import { getTextContent } from '@/lib/message-content'
import type { Message } from '@/types/conversations'
import type { ActionBarItem } from '@/types/action-bar'
import { useCopyActionBarItem } from './useCopyActionBarItem'
import { useReplyActionBarItem } from './useReplyActionBarItem'
import { useEditActionBarItem } from './useEditActionBarItem'
import { useSaveMemoryActionBarItem } from './useSaveMemoryActionBarItem'

export function useMessageActionBarItems(opts: {
  message: Message
  currentUserId: string
  conversationId: string
  onReply: (messageId: string, quotedContent: string) => void
  onEdit: (messageId: string) => void
}): ActionBarItem[] {
  const { message, currentUserId, conversationId, onReply, onEdit } = opts
  const textContent = getTextContent(message.content)
  const isSender = message.sender_user_id === currentUserId

  const copyItem = useCopyActionBarItem(textContent)
  const replyItem = useReplyActionBarItem(message.id, textContent, onReply)
  const editItem = useEditActionBarItem(message.id, isSender, onEdit)
  const saveMemoryItem = useSaveMemoryActionBarItem(textContent, conversationId)

  return [copyItem, replyItem, editItem, saveMemoryItem]
}
