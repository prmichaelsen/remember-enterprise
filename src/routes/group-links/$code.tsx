import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Users, CheckCircle, XCircle, LogIn } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

export const Route = createFileRoute('/group-links/$code')({
  head: () => ({
    meta: [
      { title: 'Group Invite — MemoryCloud' },
      { name: 'description', content: 'You\'ve been invited to join a group on MemoryCloud. Accept this invite to get started.' },
      { property: 'og:title', content: 'Group Invite — MemoryCloud' },
      { property: 'og:description', content: 'You\'ve been invited to join a group on MemoryCloud. Accept this invite to get started.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'MemoryCloud' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Group Invite — MemoryCloud' },
      { name: 'twitter:description', content: 'You\'ve been invited to join a group on MemoryCloud. Accept this invite to get started.' },
    ],
  }),
  component: RedeemGroupLinkPage,
})

function RedeemGroupLinkPage() {
  const { code } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)

  const handleRedeem = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/group-links/${code}/redeem`, { method: 'POST' })
      const data = await res.json() as { group_id?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem link')
      }

      setGroupId(data.group_id ?? null)
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to redeem link')
    }
  }

  const handleLogin = () => {
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Joined Group!</h1>
            <p className="text-gray-400 mb-6">You've been added to the group.</p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors"
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
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Group Invite</h1>
            <p className="text-gray-400 mb-6">
              You've been invited to join a group on MemoryCloud. Sign in to accept this invite.
            </p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to Accept
            </button>
          </>
        ) : (
          <>
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Group Invite</h1>
            <p className="text-gray-400 mb-6">
              You've been invited to join a group. Accept to become a member.
            </p>
            <button
              onClick={handleRedeem}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Processing...' : 'Join Group'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
