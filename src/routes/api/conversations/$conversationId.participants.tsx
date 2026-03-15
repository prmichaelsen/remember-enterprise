import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'

export const Route = createFileRoute('/api/conversations/$conversationId/participants')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        try {
          const { userId } = await request.json() as { userId: string }
          await ConversationDatabaseService.addParticipant(params.conversationId, userId)
          return Response.json({ success: true })
        } catch {
          return Response.json({ error: 'Failed to add participant' }, { status: 500 })
        }
      },
      DELETE: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const url = new URL(request.url)
        const userId = url.pathname.split('/').pop()
        if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

        try {
          await ConversationDatabaseService.removeParticipant(params.conversationId, userId)
          return Response.json({ success: true })
        } catch {
          return Response.json({ error: 'Failed to remove participant' }, { status: 500 })
        }
      },
    },
  },
})
