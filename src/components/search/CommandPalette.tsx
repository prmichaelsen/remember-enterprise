/**
 * CommandPalette — Cmd+K global search across memories, people, and conversations.
 * Rendered via createPortal to document.body.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@tanstack/react-router'
import { Brain, User, MessageSquare, Search, Loader2 } from 'lucide-react'
import Fuse from 'fuse.js'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { listConversations } from '@/services/conversation.service'
import type { MemoryItem } from '@/types/memories'
import type { Conversation } from '@/types/conversations'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'memory' | 'person' | 'conversation'
  title: string
  subtitle: string
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const t = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Cache conversations for fuse.js
  const [conversations, setConversations] = useState<Conversation[]>([])
  const conversationsLoaded = useRef(false)

  const fuseInstance = useMemo(
    () =>
      new Fuse(conversations, {
        keys: ['name', 'description'],
        threshold: 0.4,
      }),
    [conversations],
  )

  // Fetch conversations on first open
  useEffect(() => {
    if (!isOpen || conversationsLoaded.current || !user) return
    listConversations({ user_id: user.uid, limit: 50 }).then((res) => {
      setConversations(res.conversations)
      conversationsLoaded.current = true
    })
  }, [isOpen, user])

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      // Small delay so portal is mounted
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setActiveIndex(0)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()

      const [memoryResults, peopleResults] = await Promise.all([
        searchMemories(q),
        searchPeople(q),
      ])

      // Client-side conversation search via fuse.js
      const convResults = fuseInstance.search(q, { limit: 5 }).map(
        (r): SearchResult => ({
          id: r.item.id,
          type: 'conversation',
          title: r.item.name || 'Direct Message',
          subtitle: r.item.description || r.item.type,
        }),
      )

      setResults([...memoryResults, ...peopleResults, ...convResults])
      setActiveIndex(0)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, fuseInstance])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        selectResult(results[activeIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, activeIndex, onClose],
  )

  const selectResult = useCallback(
    (result: SearchResult) => {
      onClose()
      switch (result.type) {
        case 'memory':
          router.navigate({ to: '/memories' })
          break
        case 'person':
          router.navigate({ to: '/chat' })
          break
        case 'conversation':
          router.navigate({ to: `/chat/${result.id}` })
          break
      }
    },
    [onClose, router],
  )

  // Scroll active item into view
  const resultsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = resultsRef.current
    if (!container) return
    const active = container.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!isOpen) return null

  const grouped = groupResults(results)

  const iconForType = (type: SearchResult['type']) => {
    switch (type) {
      case 'memory':
        return <Brain className="w-4 h-4 shrink-0 opacity-60" />
      case 'person':
        return <User className="w-4 h-4 shrink-0 opacity-60" />
      case 'conversation':
        return <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
    }
  }

  const sectionLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'memory':
        return 'Memories'
      case 'person':
        return 'People'
      case 'conversation':
        return 'Conversations'
    }
  }

  let globalIndex = -1

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg mx-4 h-fit max-h-[60vh] flex flex-col rounded-xl shadow-2xl overflow-hidden ${t.card} border ${t.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${t.border}`}>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin opacity-40" />
          ) : (
            <Search className="w-5 h-5 opacity-40" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories, people, conversations..."
            className={`flex-1 bg-transparent outline-none text-sm ${t.textPrimary} placeholder:opacity-50`}
          />
          <kbd className={`text-xs px-1.5 py-0.5 rounded ${t.buttonSecondary} opacity-60`}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="overflow-y-auto">
          {query.trim() && !loading && results.length === 0 && (
            <div className={`px-4 py-8 text-center text-sm ${t.textMuted}`}>
              No results found
            </div>
          )}

          {grouped.map(([type, items]) => (
            <div key={type}>
              <div
                className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider ${t.textMuted}`}
              >
                {sectionLabel(type)}
              </div>
              {items.map((result) => {
                globalIndex++
                const idx = globalIndex
                const isActive = idx === activeIndex
                return (
                  <button
                    key={result.id}
                    data-active={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive ? t.active : `${t.hover}`
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectResult(result)}
                  >
                    {iconForType(result.type)}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${t.textPrimary}`}>{result.title}</div>
                      <div className={`truncate text-xs ${t.textMuted}`}>
                        {result.subtitle}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// --- helpers ---

async function searchMemories(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `/api/memories/search?query=${encodeURIComponent(query)}&limit=5`,
    )
    if (!res.ok) return []
    const data = (await res.json()) as { memories: MemoryItem[] }
    return data.memories.map((m) => ({
      id: m.id,
      type: 'memory' as const,
      title: m.title || m.content.slice(0, 60),
      subtitle: `by ${m.author_name} · ${m.scope}`,
    }))
  } catch {
    return []
  }
}

async function searchPeople(
  query: string,
): Promise<SearchResult[]> {
  try {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = (await res.json()) as {
      users: { uid: string; displayName: string | null; email: string | null }[]
    }
    return data.users.slice(0, 5).map((u) => ({
      id: u.uid,
      type: 'person' as const,
      title: u.displayName || u.email || u.uid,
      subtitle: u.email || '',
    }))
  } catch {
    return []
  }
}

function groupResults(
  results: SearchResult[],
): [SearchResult['type'], SearchResult[]][] {
  const order: SearchResult['type'][] = ['memory', 'person', 'conversation']
  const map = new Map<SearchResult['type'], SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.type)) map.set(r.type, [])
    map.get(r.type)!.push(r)
  }
  return order.filter((t) => map.has(t)).map((t) => [t, map.get(t)!])
}
