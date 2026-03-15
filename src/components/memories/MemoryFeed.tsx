/**
 * MemoryFeed — fetch memories via memory service with algorithm selector,
 * scope filtering, search, and infinite scroll.
 * Uses Virtuoso for window-scroll virtualization per pagination pattern.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Brain,
  Sparkles,
  Clock,
  Compass,
  Star,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { MemoryService, type MemoryFeedResponse } from '@/services/memory.service'
import { MemoryCard } from './MemoryCard'
import { ScopeFilter } from './ScopeFilter'
import { MemorySearch } from './MemorySearch'
import type { MemoryItem, MemoryFeedAlgorithm, MemoryScope } from '@/types/memories'

const PAGE_SIZE = 20

const ALGORITHM_OPTIONS: Array<{
  value: MemoryFeedAlgorithm
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'smart', label: 'Smart', icon: Sparkles },
  { value: 'chronological', label: 'Recent', icon: Clock },
  { value: 'discovery', label: 'Discover', icon: Compass },
  { value: 'rating', label: 'Top Rated', icon: Star },
  { value: 'significance', label: 'Significant', icon: TrendingUp },
]

interface MemoryFeedProps {
  initialData?: MemoryItem[]
}

export function MemoryFeed({ initialData }: MemoryFeedProps = {}) {
  const t = useTheme()

  // Feed state
  const [memories, setMemories] = useState<MemoryItem[]>(initialData ?? [])
  const [loading, setLoading] = useState(!initialData || initialData.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const offsetRef = useRef(0)

  // Filter state
  const [algorithm, setAlgorithm] = useState<MemoryFeedAlgorithm>('smart')
  const [scope, setScope] = useState<MemoryScope | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearching, setIsSearching] = useState(false)

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  /**
   * Load feed — reset=true clears existing memories, reset=false appends.
   */
  const loadFeed = useCallback(
    async (reset: boolean) => {
      const currentOffset = reset ? 0 : offsetRef.current

      if (reset) {
        setLoading(true)
        setMemories([])
        setError(null)
        offsetRef.current = 0
      } else {
        setLoadingMore(true)
      }

      try {
        let result: MemoryFeedResponse

        if (searchQuery) {
          result = await MemoryService.search(searchQuery, PAGE_SIZE)
        } else {
          result = await MemoryService.getFeed({
            algorithm,
            scope,
            query: null,
            limit: PAGE_SIZE,
            offset: currentOffset,
          })
        }

        const newItems = result.memories ?? []
        setMemories((prev) => (reset ? newItems : [...prev, ...newItems]))
        setHasMore(result.hasMore ?? false)
        offsetRef.current = currentOffset + newItems.length
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memories')
      } finally {
        setLoading(false)
        setLoadingMore(false)
        setIsSearching(false)
      }
    },
    [algorithm, scope, searchQuery],
  )

  // Track whether initial SSR data has been consumed
  const ssrConsumedRef = useRef(false)

  // Reload on filter/algorithm/scope change
  useEffect(() => {
    // Skip initial client fetch when SSR data exists
    if (initialData && initialData.length > 0 && !ssrConsumedRef.current) {
      ssrConsumedRef.current = true
      return
    }
    loadFeed(true)
  }, [algorithm, scope, loadFeed, initialData])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setIsSearching(!!query)
  }, [])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadFeed(false)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadFeed])

  return (
    <div className="space-y-4">
      {/* Search */}
      <MemorySearch
        onSearch={handleSearch}
        isSearching={isSearching}
        placeholder="Search memories (keyword + semantic)..."
      />

      {/* Filters Row: Algorithm + Scope */}
      <div className="space-y-3">
        {/* Algorithm selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ALGORITHM_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isSelected = algorithm === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAlgorithm(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-brand-accent text-white'
                    : `${t.buttonGhost} border border-border-default`
                }`}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Scope filter */}
        <ScopeFilter value={scope} onChange={setScope} />
      </div>

      {/* Error state */}
      {error && (
        <div className="text-brand-danger p-4 rounded-lg bg-brand-danger/10 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-elevated rounded-lg h-32 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && memories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Brain className={`w-12 h-12 ${t.textMuted} mb-3`} />
          <p className={`${t.textMuted} text-sm`}>
            {searchQuery
              ? 'No memories match your search'
              : 'No memories yet. Save your first memory from a chat message.'}
          </p>
        </div>
      )}

      {/* Memory list */}
      {!loading && memories.length > 0 && (
        <div className="space-y-2">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4">
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className={`w-5 h-5 animate-spin ${t.textMuted}`} />
          </div>
        )}
      </div>
    </div>
  )
}
