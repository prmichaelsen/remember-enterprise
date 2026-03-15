/**
 * Memories Tab Route — displays the memory feed with search, filtering,
 * and infinite scroll.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { Brain } from 'lucide-react'
import { MemoryFeed } from '@/components/memories/MemoryFeed'
import { getAuthSession } from '@/lib/auth/server-fn'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const Route = createFileRoute('/memories')({
  component: MemoriesPage,
  beforeLoad: async () => {
    if (typeof window !== 'undefined') return { initialMemories: [] }
    try {
      const user = await getAuthSession()
      if (!user) return { initialMemories: [] }
      const result = await MemoryDatabaseService.getFeed(user.uid, {
        algorithm: 'smart',
        scope: 'all',
        query: null,
        limit: 20,
        offset: 0,
      })
      return { initialMemories: result.memories ?? [] }
    } catch {
      return { initialMemories: [] }
    }
  },
})

function MemoriesPage() {
  const t = useTheme()
  const { initialMemories } = Route.useRouteContext()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-page/80 backdrop-blur-sm border-b border-border-default">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${t.textPrimary}`}>
                Memories
              </h1>
              <p className={`text-sm ${t.textMuted}`}>
                Your saved knowledge and conversations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <MemoryFeed initialData={initialMemories} />
      </div>
    </div>
  )
}
