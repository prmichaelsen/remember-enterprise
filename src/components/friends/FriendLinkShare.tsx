/**
 * FriendLinkShare — one-click generate + share/copy button for friend invite links.
 */

import { useState } from 'react'
import { Link2, Check, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { shareOrCopyUrl } from '@/lib/clipboard'

export function FriendLinkShare() {
  const t = useTheme()
  const [status, setStatus] = useState<'idle' | 'generating' | 'copied'>('idle')

  const handleShare = async () => {
    setStatus('generating')

    try {
      const res = await fetch('/api/friend-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) throw new Error('Failed to generate link')

      const data = await res.json() as { link: { url: string } }
      const result = await shareOrCopyUrl(data.link.url)

      if (result === 'shared' || result === 'copied') {
        setStatus('copied')
        setTimeout(() => setStatus('idle'), 2500)
      } else {
        setStatus('idle')
      }
    } catch (error) {
      console.error('[FriendLinkShare] error:', error)
      setStatus('idle')
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === 'generating'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        status === 'copied'
          ? 'bg-green-600/20 text-green-400'
          : `${t.buttonGhost} ${t.textSecondary}`
      } disabled:opacity-50`}
      title="Generate & share friend invite link"
    >
      {status === 'generating' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : status === 'copied' ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Link2 className="w-3.5 h-3.5" />
      )}
      {status === 'copied' ? 'Copied!' : 'Invite'}
    </button>
  )
}
