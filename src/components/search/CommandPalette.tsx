/**
 * CommandPalette — Cmd+K global search across people, conversations, and messages.
 * Queries agentbase.me Algolia indices via GET /api/search.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@tanstack/react-router'
import { User, Users, MessageSquare, Search, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

type SectionKey = 'people' | 'conversations' | 'messages'

interface SearchResult {
  objectID: string
  section: SectionKey
  label: string
  subtitle: string
  conversationId?: string
}

interface ApiResponse {
  people?: Array<{
    objectID: string
    display_name?: string
    username?: string
    profile_picture_path?: string
  }>
  conversations?: Array<{
    objectID: string
    title?: string
    last_message_preview?: string
  }>
  messages?: Array<{
    objectID: string
    content?: string
    conversation_id?: string
    conversation_title?: string
    sender_display_name?: string
  }>
}

function normalizeResults(data: ApiResponse): SearchResult[] {
  const results: SearchResult[] = []

  for (const p of data.people ?? []) {
    results.push({
      objectID: p.objectID,
      section: 'people',
      label: p.display_name || p.username || 'Unknown',
      subtitle: p.username ? `@${p.username}` : '',
    })
  }

  for (const c of data.conversations ?? []) {
    results.push({
      objectID: c.objectID,
      section: 'conversations',
      label: c.title || 'Untitled',
      subtitle: c.last_message_preview ? c.last_message_preview.slice(0, 80) : '',
      conversationId: c.objectID,
    })
  }

  for (const m of data.messages ?? []) {
    results.push({
      objectID: m.objectID,
      section: 'messages',
      label: m.conversation_title || 'Message',
      subtitle: m.sender_display_name
        ? `${m.sender_display_name}: ${(m.content ?? '').slice(0, 60)}`
        : (m.content ?? '').slice(0, 80),
      conversationId: m.conversation_id,
    })
  }

  return results
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const t = useTheme()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
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
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&hitsPerPage=5`,
        )
        if (res.ok) {
          const data = (await res.json()) as ApiResponse
          setResults(normalizeResults(data))
        } else {
          setResults([])
        }
      } catch {
        setResults([])
      }
      setActiveIndex(0)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

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
      if (result.conversationId) {
        router.navigate({ to: `/chat/${result.conversationId}` })
      } else if (result.section === 'people') {
        router.navigate({ to: '/chat' })
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

  const iconForSection = (section: SectionKey) => {
    switch (section) {
      case 'people':
        return <User className="w-4 h-4 shrink-0 opacity-60" />
      case 'conversations':
        return <Users className="w-4 h-4 shrink-0 opacity-60" />
      case 'messages':
        return <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
    }
  }

  const sectionLabel = (section: SectionKey) => {
    switch (section) {
      case 'people':
        return 'People'
      case 'conversations':
        return 'Conversations'
      case 'messages':
        return 'Messages'
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
            placeholder="Search people, conversations, messages..."
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

          {grouped.map(([section, items]) => (
            <div key={section}>
              <div
                className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider ${t.textMuted}`}
              >
                {sectionLabel(section)}
              </div>
              {items.map((result) => {
                globalIndex++
                const idx = globalIndex
                const isActive = idx === activeIndex
                return (
                  <button
                    key={result.objectID}
                    data-active={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive ? t.active : `${t.hover}`
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectResult(result)}
                  >
                    {iconForSection(result.section)}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate ${t.textPrimary}`}>{result.label}</div>
                      {result.subtitle && (
                        <div className={`truncate text-xs ${t.textMuted}`}>
                          {result.subtitle}
                        </div>
                      )}
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

function groupResults(results: SearchResult[]): [SectionKey, SearchResult[]][] {
  const order: SectionKey[] = ['people', 'conversations', 'messages']
  const map = new Map<SectionKey, SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.section)) map.set(r.section, [])
    map.get(r.section)!.push(r)
  }
  return order.filter((s) => map.has(s)).map((s) => [s, map.get(s)!])
}
