import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { UserPlus, CheckCircle, XCircle, LogIn } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

export const Route = createFileRoute('/friend-links/$code')({
  head: () => ({
    meta: [
      { title: 'Friend Invite — MemoryCloud' },
      { name: 'description', content: 'You\'ve been invited to connect on MemoryCloud. Accept this friend invite to get started.' },
      { property: 'og:title', content: 'Friend Invite — MemoryCloud' },
      { property: 'og:description', content: 'You\'ve been invited to connect on MemoryCloud. Accept this friend invite to get started.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'MemoryCloud' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Friend Invite — MemoryCloud' },
      { name: 'twitter:description', content: 'You\'ve been invited to connect on MemoryCloud. Accept this friend invite to get started.' },
    ],
  }),
  component: RedeemFriendLinkPage,
})

function RedeemFriendLinkPage() {
  const { code } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRedeem = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/friend-links/${code}/redeem`, { method: 'POST' })
      const data = await res.json() as { error?: string; relationship?: any }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem link')
      }

      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to redeem link')
    }
  }

  const handleLogin = () => {
    navigate({ to: '/auth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Friend Request Sent!</h1>
            <p className="text-gray-400 mb-6">
              A pending friend request has been created.
            </p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Chat
            </a>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Could not redeem link</h1>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Go to Chat
            </a>
          </>
        ) : !user || user.isAnonymous ? (
          <>
            <UserPlus className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Friend Invite</h1>
            <p className="text-gray-400 mb-6">
              You've been invited to connect on MemoryCloud. Sign in to accept this friend invite.
            </p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to Accept
            </button>
          </>
        ) : (
          <>
            <UserPlus className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Friend Invite</h1>
            <p className="text-gray-400 mb-6">
              Someone shared a friend link with you. Accept to send them a friend request.
            </p>
            <button
              onClick={handleRedeem}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Processing...' : 'Accept Friend Request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
