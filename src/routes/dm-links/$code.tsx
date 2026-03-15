import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { MessageSquare, CheckCircle, XCircle, LogIn } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

export const Route = createFileRoute('/dm-links/$code')({
  head: () => ({
    meta: [
      { title: 'DM Invite — MemoryCloud' },
      { name: 'description', content: 'You\'ve been invited to start a conversation on MemoryCloud. Accept this DM invite to get started.' },
      { property: 'og:title', content: 'DM Invite — MemoryCloud' },
      { property: 'og:description', content: 'You\'ve been invited to start a conversation on MemoryCloud. Accept this DM invite to get started.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'MemoryCloud' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'DM Invite — MemoryCloud' },
      { name: 'twitter:description', content: 'You\'ve been invited to start a conversation on MemoryCloud. Accept this DM invite to get started.' },
    ],
  }),
  component: RedeemDmLinkPage,
})

function RedeemDmLinkPage() {
  const { code } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRedeem = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/dm-links/${code}/redeem`, { method: 'POST' })
      const data = await res.json() as { conversation_id?: string; partner_user_id?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem link')
      }

      setStatus('success')
      setTimeout(() => {
        if (data.conversation_id) {
          navigate({ to: '/chat/$conversationId', params: { conversationId: data.conversation_id } })
        } else {
          navigate({ to: '/chat' })
        }
      }, 1000)
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
            <h1 className="text-xl font-bold text-white mb-2">Conversation Created!</h1>
            <p className="text-gray-400 mb-6">Redirecting to your conversation...</p>
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
            <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">DM Invite</h1>
            <p className="text-gray-400 mb-6">
              You've been invited to start a conversation on MemoryCloud. Sign in to accept this invite.
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
            <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">DM Invite</h1>
            <p className="text-gray-400 mb-6">Someone wants to start a conversation with you.</p>
            <button
              onClick={handleRedeem}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Processing...' : 'Accept & Open Chat'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
