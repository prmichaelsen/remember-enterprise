/**
 * Ghost Tab Route — AI persona chat interface.
 * Select a ghost persona and start/resume conversations.
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Ghost } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { GhostSelector } from '@/components/ghost/GhostSelector'
import { GhostChat } from '@/components/ghost/GhostChat'
import type { GhostPersona } from '@/services/ghost.service'
import { getAuthSession } from '@/lib/auth/server-fn'
import { GhostDatabaseService } from '@/services/ghost-database.service'

export const Route = createFileRoute('/ghost')({
  component: GhostPage,
  beforeLoad: async () => {
    if (typeof window !== 'undefined') return { initialGhosts: [] }
    try {
      const user = await getAuthSession()
      if (!user) return { initialGhosts: [] }
      const ghosts = await GhostDatabaseService.listGhosts(user.uid)
      return { initialGhosts: ghosts }
    } catch {
      return { initialGhosts: [] }
    }
  },
})

function GhostPage() {
  const t = useTheme()
  const { initialGhosts } = Route.useRouteContext()
  const [selectedGhost, setSelectedGhost] = useState<GhostPersona | null>(null)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-page/80 backdrop-blur-sm border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center">
              <Ghost className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${t.textPrimary}`}>Ghost</h1>
              <p className={`text-sm ${t.textMuted}`}>
                Chat with AI personas powered by your memories
              </p>
            </div>
            {selectedGhost && (
              <button
                type="button"
                onClick={() => setSelectedGhost(null)}
                className={`ml-auto text-sm ${t.buttonGhost} px-3 py-1.5 rounded-lg`}
              >
                Change Ghost
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {selectedGhost ? (
          <div className="h-[calc(100vh-88px)]">
            <GhostChat ghost={selectedGhost} />
          </div>
        ) : (
          <div className="px-4 py-6">
            <GhostSelector
              selectedGhostId={selectedGhost?.id ?? null}
              onSelect={setSelectedGhost}
              initialGhosts={initialGhosts}
            />
          </div>
        )}
      </div>
    </div>
  )
}
