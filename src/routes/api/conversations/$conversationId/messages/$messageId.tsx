import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'

export const Route = createFileRoute(
  '/api/conversations/$conversationId/messages/$messageId',
)({
  server: {
    handlers: {
      GET: async ({
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

        try {
          const message = await MessageDatabaseService.getMessage(
            params.conversationId,
            params.messageId,
          )

          if (!message) {
            return Response.json(
              { error: 'Message not found' },
              { status: 404 },
            )
          }

          return Response.json(message)
        } catch (error) {
          console.error('[API] Message get error:', error)
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

        try {
          const body = await request.json()
          const { content, saved_memory_id } = body

          const updates: Partial<{ content: string; saved_memory_id: string | null }> = {}
          if (content !== undefined) updates.content = content
          if (saved_memory_id !== undefined) updates.saved_memory_id = saved_memory_id

          if (Object.keys(updates).length === 0) {
            return Response.json(
              { error: 'No update fields provided' },
              { status: 400 },
            )
          }

          await MessageDatabaseService.updateMessage(
            params.conversationId,
            params.messageId,
            updates,
          )

          return Response.json({ updated: true })
        } catch (error) {
          console.error('[API] Message update error:', error)
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

      DELETE: async ({
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

        try {
          await MessageDatabaseService.deleteMessage(
            params.conversationId,
            params.messageId,
          )

          return Response.json({ deleted: true })
        } catch (error) {
          console.error('[API] Message delete error:', error)
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
