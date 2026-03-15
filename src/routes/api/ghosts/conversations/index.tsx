import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GhostDatabaseService } from '@/services/ghost-database.service'

export const Route = createFileRoute('/api/ghosts/conversations/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const conversations = await GhostDatabaseService.listConversations(session.uid)
        return Response.json({ conversations })
      },
    },
  },
})
