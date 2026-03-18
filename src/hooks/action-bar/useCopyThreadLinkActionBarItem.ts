import { Link } from 'lucide-react'
import type { Message } from '@/types/conversations'
import type { ActionBarItem } from '@/types/action-bar'
import { getThreadLink } from '@/lib/thread-links'

export function useCopyThreadLinkActionBarItem(
  message: Message,
  conversationId: string,
): ActionBarItem {
  return {
    key: 'copy-thread-link',
    icon: Link,
    label: 'Copy link',
    onTrigger: () => {
      if (!message.parent_message_id) return

      const link = getThreadLink(
        conversationId,
        message.parent_message_id,
        message.id,
      )
      const fullUrl = `${window.location.origin}${link}`

      navigator.clipboard.writeText(fullUrl)
      // TODO: Show toast notification "Link copied"
    },
  }
}
