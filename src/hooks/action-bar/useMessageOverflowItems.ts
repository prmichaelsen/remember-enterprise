import type { Message } from '@/types/conversations'
import type { ActionBarItem } from '@/types/action-bar'
import { getTextContent } from '@/lib/message-content'
import { useDeleteActionBarItem } from './useDeleteActionBarItem'
import { useForwardActionBarItem } from './useForwardActionBarItem'
import { usePinActionBarItem } from './usePinActionBarItem'
import { useReportActionBarItem } from './useReportActionBarItem'
import { useOverflowActionBarItem } from '@/components/action-bar/OverflowMenu'

export function useMessageOverflowItems(opts: {
  message: Message
  conversationId: string
  currentUserId: string
  canModerate: boolean
  onDelete: (messageId: string) => void
  onTogglePin: (messageId: string) => void
  onReport: (messageId: string) => void
}): ActionBarItem {
  const { message, conversationId, currentUserId, canModerate, onDelete, onTogglePin, onReport } =
    opts

  const isSender = message.sender_user_id === currentUserId
  const isPinned = (message.metadata as any)?.pinned ?? false
  const content = getTextContent(message.content)

  const deleteItem = useDeleteActionBarItem(message.id, conversationId, isSender, canModerate, onDelete)
  const forwardItem = useForwardActionBarItem(content)
  const pinItem = usePinActionBarItem(message.id, isPinned, onTogglePin)
  const reportItem = useReportActionBarItem(message.id, isSender, onReport)

  return useOverflowActionBarItem([deleteItem, forwardItem, pinItem, reportItem])
}
