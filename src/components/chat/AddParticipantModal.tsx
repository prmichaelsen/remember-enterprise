import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/lib/theming'
import { Modal } from '@/components/ui/Modal'
import { inviteMember } from '@/services/group.service'
import { Search, Copy, Check, Loader2 } from 'lucide-react'

interface UserResult {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
}

interface InviteLink {
  url: string
  code: string
  expires_at: string
  max_uses: number
  use_count: number
}

interface AddParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
}

export function AddParticipantModal({
  isOpen,
  onClose,
  conversationId,
}: AddParticipantModalProps) {
  const t = useTheme()
  const [tab, setTab] = useState<'search' | 'invite'>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Invite link state
  const [expiryHours, setExpiryHours] = useState(24)
  const [maxUses, setMaxUses] = useState(10)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setFeedback(null)
      setInviteLink(null)
      setCopied(false)
      setTab('search')
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) throw new Error('Search failed')
        const data = (await res.json()) as any
        setResults(data.users ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function handleInvite(userId: string) {
    setInvitingId(userId)
    setFeedback(null)
    try {
      await inviteMember(conversationId, userId)
      setFeedback({ type: 'success', message: 'Member invited successfully' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to invite member' })
    } finally {
      setInvitingId(null)
    }
  }

  async function handleGenerateLink() {
    setGeneratingLink(true)
    try {
      const res = await fetch(`/api/groups/${conversationId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_hours: expiryHours, max_uses: maxUses }),
      })
      if (!res.ok) throw new Error('Failed to generate link')
      const data = (await res.json()) as any
      setInviteLink(data.link)
    } catch {
      setFeedback({ type: 'error', message: 'Failed to generate invite link' })
    } finally {
      setGeneratingLink(false)
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — ignore
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Participant" maxWidth="md">
      {/* Tabs */}
      <div className={`flex border-b ${t.border} mb-4`}>
        <button
          type="button"
          onClick={() => setTab('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'search'
              ? `border-accent ${t.textPrimary}`
              : `border-transparent ${t.textMuted} hover:${t.textSecondary}`
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setTab('invite')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'invite'
              ? `border-accent ${t.textPrimary}`
              : `border-transparent ${t.textMuted} hover:${t.textSecondary}`
          }`}
        >
          Invite Link
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div>
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg border text-base ${t.border} ${t.textPrimary} bg-bg-elevated focus:outline-none focus:ring-1 focus:ring-accent`}
            />
          </div>

          {searching && (
            <div className={`flex items-center justify-center py-4 ${t.textMuted}`}>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Searching...
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleInvite(u.uid)}
                  disabled={invitingId === u.uid}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left hover:bg-bg-elevated transition-colors disabled:opacity-50`}
                >
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-medium ${t.textMuted}`}>
                      {(u.displayName ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${t.textPrimary}`}>{u.displayName}</p>
                    <p className={`text-xs truncate ${t.textMuted}`}>{u.email}</p>
                  </div>
                  {invitingId === u.uid && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              ))}
            </div>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <p className={`text-sm py-4 text-center ${t.textMuted}`}>No users found</p>
          )}
        </div>
      )}

      {/* Invite Link Tab */}
      {tab === 'invite' && (
        <div>
          {!inviteLink ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${t.textSecondary}`}>
                  Expires in (hours)
                </label>
                <input
                  type="number"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  min={1}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${t.border} ${t.textPrimary} bg-bg-elevated focus:outline-none focus:ring-1 focus:ring-accent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${t.textSecondary}`}>
                  Max uses
                </label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  min={1}
                  className={`w-full px-3 py-2 rounded-lg border text-base ${t.border} ${t.textPrimary} bg-bg-elevated focus:outline-none focus:ring-1 focus:ring-accent`}
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {generatingLink ? 'Generating...' : 'Generate Invite Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${t.border} bg-bg-elevated`}>
                <input
                  type="text"
                  readOnly
                  value={inviteLink.url}
                  className={`flex-1 text-base bg-transparent ${t.textPrimary} outline-none`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg ${t.buttonGhost}`}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className={`text-xs ${t.textMuted}`}>
                Expires: {new Date(inviteLink.expires_at).toLocaleString()}
                {' | '}
                Max uses: {inviteLink.max_uses}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
