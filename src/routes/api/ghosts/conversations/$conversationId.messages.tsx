import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GhostDatabaseService } from '@/services/ghost-database.service'

export const Route = createFileRoute(
  '/api/ghosts/conversations/$conversationId/messages',
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

        const { conversationId } = params
        if (!conversationId) {
          return Response.json({ error: 'conversationId is required' }, { status: 400 })
        }

        let body: { content?: string }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { content } = body
        if (!content || typeof content !== 'string') {
          return Response.json({ error: 'content is required' }, { status: 400 })
        }

        const result = await GhostDatabaseService.sendMessage(
          session.uid,
          conversationId,
          { role: 'user', content },
        )

        return Response.json({
          message: result.message,
          memoryContext: result.memoryContext,
        })
      },
    },
  },
})
