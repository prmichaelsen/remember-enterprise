import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'

export const Route = createFileRoute(
  '/api/conversations/$conversationId/read',
)({
  server: {
    handlers: {
      POST: async ({
        request,
        params,
      }: {
        request: Request
        params: { conversationId: string }
      }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          await MessageDatabaseService.markConversationRead(
            params.conversationId,
            session.uid,
          )

          return Response.json({ success: true })
        } catch (error) {
          console.error('[API] Mark read error:', error)
          return Response.json(
            {
              error: 'Internal server error',
              message:
                error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
