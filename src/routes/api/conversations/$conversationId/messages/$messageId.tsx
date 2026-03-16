import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/conversations/messages/messageId')

export const Route = createFileRoute(
  '/api/conversations/$conversationId/messages/$messageId' as any,
)({
  server: {
    handlers: {
      PATCH: async ({
        request,
        params,
      }: {
        request: Request
        params: { conversationId: string; messageId: string }
      }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { content } = body
        if (content !== undefined && typeof content !== 'string') {
          return Response.json(
            { error: 'content must be a string' },
            { status: 400 },
          )
        }

        try {
          await MessageDatabaseService.updateMessage(
            params.conversationId,
            params.messageId,
            { ...(content !== undefined && { content }) },
          )
          return Response.json({ ok: true })
        } catch (error) {
          log.error({ err: error }, 'PATCH message failed')
          return Response.json(
            { error: 'Failed to update message' },
            { status: 500 },
          )
        }
      },
    },
  },
})
