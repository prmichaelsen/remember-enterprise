import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { syncMessageToAlgolia, getParticipantIds } from '@/lib/algolia-sync'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/conversations/messages')

export const Route = createFileRoute('/api/conversations/$conversationId/messages')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
        const beforeCursor = url.searchParams.get('before_cursor') ?? undefined

        try {
          const conv = await ConversationDatabaseService.getConversation(params.conversationId, session.uid)
          const convType = conv?.type === 'dm' || conv?.type === 'group' ? conv.type : undefined

          const result = await MessageDatabaseService.listMessages(
            params.conversationId,
            limit,
            beforeCursor,
            session.uid,
            convType,
          )
          return Response.json(result)
        } catch (err) {
          log.error({ err }, 'GET failed')
          return Response.json({ error: 'Failed to fetch messages' }, { status: 500 })
        }
      },

      POST: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
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

        const { content, visible_to_user_ids, role, metadata, is_tool_interaction } = body

        if (!content) {
          return Response.json({ error: 'Message content required' }, { status: 400 })
        }

        try {
          const conv = await ConversationDatabaseService.getConversation(params.conversationId, session.uid)
          const convType = conv?.type === 'dm' || conv?.type === 'group' ? conv.type : undefined

          const message = await MessageDatabaseService.sendMessage(params.conversationId, {
            sender_user_id: session.uid,
            content,
            visible_to_user_ids,
            role,
            ...(metadata && { metadata }),
            ...(is_tool_interaction != null && { is_tool_interaction }),
          }, convType)

          const pIds = await getParticipantIds(params.conversationId, session.uid)
          const senderName = session.displayName ?? session.email ?? 'Unknown'
          await syncMessageToAlgolia(message, pIds, senderName)

          return Response.json(message, { status: 201 })
        } catch (err) {
          log.error({ err }, 'POST failed')
          return Response.json({ error: 'Failed to send message' }, { status: 500 })
        }
      },
    },
  },
})
