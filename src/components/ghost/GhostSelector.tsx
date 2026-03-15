/**
 * GhostSelector — list available ghost personas, select one to
 * start or resume a conversation.
 */

import { useState, useEffect } from 'react'
import { Ghost, MessageCircle, Loader2, Shield } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { GhostService, type GhostPersona } from '@/services/ghost.service'

interface GhostSelectorProps {
  /** Currently selected ghost ID */
  selectedGhostId: string | null
  /** Callback when a ghost is selected */
  onSelect: (ghost: GhostPersona) => void
  /** SSR-preloaded ghost list */
  initialGhosts?: GhostPersona[]
}

const TRUST_TIER_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  public: { label: 'Public', className: 'bg-brand-success/15 text-brand-success' },
  friends: { label: 'Friends', className: 'bg-brand-info/15 text-brand-info' },
  'inner-circle': { label: 'Inner Circle', className: 'bg-brand-warning/15 text-brand-warning' },
  private: { label: 'Private', className: 'bg-brand-danger/15 text-brand-danger' },
}

export function GhostSelector({
  selectedGhostId,
  onSelect,
  initialGhosts,
}: GhostSelectorProps) {
  const t = useTheme()
  const [ghosts, setGhosts] = useState<GhostPersona[]>(initialGhosts ?? [])
  const [loading, setLoading] = useState(!initialGhosts || initialGhosts.length === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip client-side fetch when SSR data exists
    if (initialGhosts && initialGhosts.length > 0) return

    setLoading(true)
    GhostService.listGhosts()
      .then(setGhosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [initialGhosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-6 h-6 animate-spin ${t.textMuted}`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-brand-danger text-sm p-4 rounded-lg bg-brand-danger/10">
        Failed to load ghosts: {error}
      </div>
    )
  }

  if (ghosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Ghost className={`w-12 h-12 ${t.textMuted} mb-3`} />
        <p className={`${t.textMuted} text-sm`}>
          No ghost personas available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className={`text-sm font-medium ${t.textMuted} px-1 mb-3`}>
        Select a Ghost to chat with
      </h3>
      {ghosts.map((ghost) => {
        const isSelected = ghost.id === selectedGhostId
        const trustConfig = TRUST_TIER_CONFIG[ghost.trustTier] ?? TRUST_TIER_CONFIG.public

        return (
          <button
            key={ghost.id}
            type="button"
            onClick={() => onSelect(ghost)}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
              isSelected
                ? 'border-brand-accent bg-brand-accent/5'
                : `${t.borderSubtle} ${t.hover}`
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0">
              {ghost.avatarUrl ? (
                <img
                  src={ghost.avatarUrl}
                  alt={ghost.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Ghost className="w-5 h-5 text-brand-accent" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-semibold ${t.textPrimary}`}>
                  {ghost.name}
                </h4>
                {isSelected && (
                  <MessageCircle className="w-3.5 h-3.5 text-brand-accent" />
                )}
              </div>
              <p className={`text-xs ${t.textMuted} line-clamp-2 mt-0.5`}>
                {ghost.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${trustConfig.className}`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {trustConfig.label}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
