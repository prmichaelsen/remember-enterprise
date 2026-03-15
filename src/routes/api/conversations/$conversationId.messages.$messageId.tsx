import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'

export const Route = createFileRoute('/api/conversations/$conversationId/messages/$messageId')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { conversationId: string; messageId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const message = await MessageDatabaseService.getMessage(params.conversationId, params.messageId)
          if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 })
          }
          return Response.json(message)
        } catch (err) {
          console.error('[api/conversations/messages/$messageId] GET failed:', err)
          return Response.json({ error: 'Failed to fetch message' }, { status: 500 })
        }
      },

      PATCH: async ({ request, params }: { request: Request; params: { conversationId: string; messageId: string } }) => {
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
        if (content === undefined) {
          return Response.json({ error: 'Missing content field' }, { status: 400 })
        }

        try {
          await MessageDatabaseService.updateMessage(params.conversationId, params.messageId, { content })
          return Response.json({ ok: true })
        } catch (err) {
          console.error('[api/conversations/messages/$messageId] PATCH failed:', err)
          return Response.json({ error: 'Failed to update message' }, { status: 500 })
        }
      },

      DELETE: async ({ request, params }: { request: Request; params: { conversationId: string; messageId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          await MessageDatabaseService.deleteMessage(params.conversationId, params.messageId)
          return Response.json({ ok: true })
        } catch (err) {
          console.error('[api/conversations/messages/$messageId] DELETE failed:', err)
          return Response.json({ error: 'Failed to delete message' }, { status: 500 })
        }
      },
    },
  },
})
