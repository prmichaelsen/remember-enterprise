import { MessageSquareReply } from 'lucide-react'
import type { ActionBarItem } from '@/types/action-bar'
import type { Message } from '@/types/conversations'

export function useReplyInThreadActionBarItem(
  message: Message,
  onOpenThread: (message: Message) => void
): ActionBarItem {
  return {
    key: 'reply-in-thread',
    label: 'Reply in thread',
    icon: MessageSquareReply,
    onTrigger: () => onOpenThread(message),
  }
}
