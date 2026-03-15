import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GhostDatabaseService } from '@/services/ghost-database.service'

export const Route = createFileRoute('/api/ghosts/$ghostId/conversation')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { ghostId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { ghostId } = params
        if (!ghostId) {
          return Response.json({ error: 'ghostId is required' }, { status: 400 })
        }

        const conversation = await GhostDatabaseService.getOrCreateConversation(
          session.uid,
          ghostId,
        )
        return Response.json(conversation)
      },
    },
  },
})
