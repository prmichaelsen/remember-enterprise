import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'
import { syncMessageToAlgolia, getParticipantIds } from '@/lib/algolia-sync'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/conversations/messages')

export const Route = createFileRoute(
  '/api/conversations/$conversationId/messages/' as any,
)({
  server: {
    handlers: {
      GET: async ({
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
          const url = new URL(request.url)
          const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
          const cursor = url.searchParams.get('before_cursor') ?? undefined

          const result = await MessageDatabaseService.listMessages(
            params.conversationId,
            limit,
            cursor,
          )

          return Response.json(result)
        } catch (error) {
          log.error({ err: error }, 'Message list error')
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
          const body = await (request.json() as Promise<any>)
          const { content, role, attachments, sender_name, sender_photo_url, visible_to_user_ids } = body

          if (!content || typeof content !== 'string') {
            return Response.json(
              { error: 'content is required and must be a string' },
              { status: 400 },
            )
          }

          const message = await MessageDatabaseService.sendMessage(
            params.conversationId,
            {
              sender_id: session.uid,
              sender_name: sender_name ?? session.displayName ?? 'Unknown',
              sender_photo_url: sender_photo_url ?? session.photoURL ?? null,
              content,
              role: role ?? 'user',
              attachments: attachments ?? [],
              visible_to_user_ids: visible_to_user_ids ?? null,
            },
          )

          const pIds = await getParticipantIds(params.conversationId, session.uid)
          await syncMessageToAlgolia(message, pIds)

          return Response.json(message, { status: 201 })
        } catch (error) {
          log.error({ err: error }, 'Message send error')
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
