import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'

export const Route = createFileRoute('/api/conversations/$conversationId/last-message')({
  server: {
    handlers: {
      PUT: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        try {
          const preview = await request.json() as { content: string; sender_user_id: string; timestamp: string }
          await ConversationDatabaseService.updateLastMessage(params.conversationId, preview)
          return Response.json({ success: true })
        } catch {
          return Response.json({ error: 'Failed to update' }, { status: 500 })
        }
      },
    },
  },
})
