import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { syncMessageToAlgolia, getParticipantIds } from '@/lib/algolia-sync'
import { getTextContent } from '@/lib/message-content'
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
          const { content, role, visible_to_user_ids, metadata, is_tool_interaction } = body

          if (!content) {
            return Response.json(
              { error: 'content is required' },
              { status: 400 },
            )
          }

          const message = await MessageDatabaseService.sendMessage(
            params.conversationId,
            {
              sender_user_id: session.uid,
              content,
              role: role ?? 'user',
              visible_to_user_ids: visible_to_user_ids ?? null,
              ...(metadata && { metadata }),
              ...(is_tool_interaction != null && { is_tool_interaction }),
            },
          )

          // Update conversation last_message metadata
          try {
            const preview = getTextContent(message.content)
            await ConversationDatabaseService.updateLastMessage(
              params.conversationId,
              {
                content: preview.substring(0, 200),
                sender_user_id: session.uid,
                timestamp: message.timestamp,
              },
            )
          } catch (updateErr) {
            log.error({ err: updateErr }, 'Failed to update conversation last_message')
          }

          const pIds = await getParticipantIds(params.conversationId, session.uid)
          const senderName = session.displayName ?? session.email ?? 'Unknown'
          await syncMessageToAlgolia(message, pIds, senderName)

          // Broadcast to WebSocket clients via ChatRoom DO
          try {
            const chatRoomBinding = (env as any).CHAT_ROOM as DurableObjectNamespace
            const doId = chatRoomBinding.idFromName(params.conversationId)
            const stub = chatRoomBinding.get(doId)

            await stub.fetch(new Request('https://do/broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'message_new',
                conversation_id: params.conversationId,
                message: {
                  id: message.id,
                  sender_user_id: message.sender_user_id,
                  content: message.content,
                  timestamp: message.timestamp,
                  visible_to_user_ids: message.visible_to_user_ids ?? null,
                  role: message.role,
                },
              }),
            }))
          } catch (broadcastErr) {
            log.error({ err: broadcastErr }, 'WebSocket broadcast failed')
          }

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
