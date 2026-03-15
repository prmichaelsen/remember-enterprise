/**
 * Conversation detail view — shows messages for a selected conversation.
 * Reuses the same chat components as /chat/$conversationId.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/conversations/$conversationId')({
  component: ConversationDetail,
})

function ConversationDetail() {
  const t = useTheme()
  const { conversationId } = Route.useParams()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-border-default`}>
        <MessageSquare className={`w-5 h-5 ${t.textMuted}`} />
        <h2 className={`text-sm font-semibold ${t.textPrimary} truncate`}>
          {conversationId}
        </h2>
      </div>

      {/* Message area — placeholder until wired to real message loading */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className={`text-sm ${t.textMuted}`}>
            Conversation detail view coming soon.
          </p>
          <p className={`text-xs mt-1 ${t.textMuted}`}>
            ID: {conversationId}
          </p>
        </div>
      </div>
    </div>
  )
}
