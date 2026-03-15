/**
 * Chat index route — shown when no conversation is selected.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/chat/')({
  component: ChatIndex,
})

function ChatIndex() {
  const t = useTheme()

  return (
    <div className={`flex-1 flex items-center justify-center ${t.page}`}>
      <div className="text-center">
        <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${t.textMuted}`} />
        <h2 className={`text-lg font-medium ${t.textPrimary}`}>
          Select a conversation
        </h2>
        <p className={`text-sm mt-1 ${t.textMuted}`}>
          Choose a conversation from the sidebar or start a new one.
        </p>
      </div>
    </div>
  )
}
