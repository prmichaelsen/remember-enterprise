import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { MessagesSquare } from 'lucide-react'

export const Route = createFileRoute('/conversations/')({
  component: ConversationsIndex,
})

function ConversationsIndex() {
  const t = useTheme()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MessagesSquare className={`w-12 h-12 mx-auto mb-3 ${t.textMuted}`} />
        <h2 className={`text-lg font-semibold mb-1 ${t.textPrimary}`}>Select a conversation</h2>
        <p className={`text-sm ${t.textMuted}`}>
          Choose a conversation from the sidebar to view it.
        </p>
      </div>
    </div>
  )
}
