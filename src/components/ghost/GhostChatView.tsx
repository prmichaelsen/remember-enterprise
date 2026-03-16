/**
 * GhostChatView — wraps GhostChat to work as a sub-tab within conversations.
 * Loads ghost personas and renders the chat UI with a specific ghost owner context.
 */

import { useState, useEffect } from 'react'
import { Ghost, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { GhostChat } from './GhostChat'
import { GhostSelector } from './GhostSelector'
import { GhostService, type GhostPersona } from '@/services/ghost.service'

interface GhostChatViewProps {
  ghostOwnerId: string
}

export function GhostChatView({ ghostOwnerId }: GhostChatViewProps) {
  const t = useTheme()
  const [ghosts, setGhosts] = useState<GhostPersona[]>([])
  const [selectedGhost, setSelectedGhost] = useState<GhostPersona | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadGhosts() {
      setLoading(true)
      setError(null)
      try {
        const personas = await GhostService.listGhosts()
        if (cancelled) return
        setGhosts(personas)
        // Auto-select first ghost if only one available
        if (personas.length === 1) {
          setSelectedGhost(personas[0])
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load ghost personas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGhosts()
    return () => { cancelled = true }
  }, [ghostOwnerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-purple-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading ghost...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-bg-elevated rounded-full flex items-center justify-center">
            <Ghost className={`w-6 h-6 ${t.textMuted}`} />
          </div>
          <p className={`text-sm ${t.textMuted}`}>{error}</p>
        </div>
      </div>
    )
  }

  if (!selectedGhost) {
    return (
      <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
        <GhostSelector
          selectedGhostId={null}
          onSelect={setSelectedGhost}
          initialGhosts={ghosts}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Change ghost button */}
      {ghosts.length > 1 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            type="button"
            onClick={() => setSelectedGhost(null)}
            className={`text-xs ${t.buttonGhost} px-2 py-1 rounded`}
          >
            Change Ghost
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <GhostChat ghost={selectedGhost} />
      </div>
    </div>
  )
}
