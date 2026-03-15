/**
 * MemorySearch — search bar with hybrid search (vector + keyword)
 * via the memory service.
 */

import { useState, useCallback, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'

interface MemorySearchProps {
  /** Called when search query changes (debounced) */
  onSearch: (query: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether a search is currently in progress */
  isSearching?: boolean
}

export function MemorySearch({
  onSearch,
  placeholder = 'Search memories...',
  isSearching = false,
}: MemorySearchProps) {
  const t = useTheme()
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)

      // Debounce search by 300ms
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearch(value.trim())
      }, 300)
    },
    [onSearch],
  )

  const handleClear = useCallback(() => {
    setQuery('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSearch('')
  }, [onSearch])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onSearch(query.trim())
    },
    [query, onSearch],
  )

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Search icon or loading spinner */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <Loader2 className={`w-4 h-4 ${t.textMuted} animate-spin`} />
        ) : (
          <Search className={`w-4 h-4 ${t.textMuted}`} />
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-9 py-2.5 rounded-lg ${t.input} ${t.inputFocus} outline-none transition-colors`}
        aria-label="Search memories"
      />

      {/* Clear button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} hover:text-text-primary transition-colors`}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
