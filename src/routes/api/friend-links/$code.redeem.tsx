import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { FriendLinkService } from '@/services/friend-link.service'

export const Route = createFileRoute('/api/friend-links/$code/redeem')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { code: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const result = await FriendLinkService.redeemFriendLink(session.uid, params.code)

          if ('error' in result) {
            return Response.json({ error: result.error }, { status: 400 })
          }

          return Response.json({ relationship: result.relationship })
        } catch (error) {
          console.error('[api/friend-links/$code/redeem] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
