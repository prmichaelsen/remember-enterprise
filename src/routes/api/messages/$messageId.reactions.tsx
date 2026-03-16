import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { MessageDatabaseService } from '@/services/message-database.service'
import { setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/messages/reactions')

export const Route = createFileRoute(
  '/api/messages/$messageId/reactions' as any,
)({
  server: {
    handlers: {
      POST: async ({
        request,
        params,
      }: {
        request: Request
        params: { messageId: string }
      }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: { emoji: string; conversation_id: string }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { emoji, conversation_id } = body
        if (!emoji || !conversation_id) {
          return Response.json(
            { error: 'emoji and conversation_id are required' },
            { status: 400 },
          )
        }

        try {
          const conv = await ConversationDatabaseService.getConversation(
            conversation_id,
            session.uid,
          )
          const convType =
            conv?.type === 'dm' || conv?.type === 'group'
              ? conv.type
              : undefined

          const message = await MessageDatabaseService.getMessage(
            conversation_id,
            params.messageId,
            session.uid,
            convType,
          )

          if (!message) {
            return Response.json(
              { error: 'Message not found' },
              { status: 404 },
            )
          }

          const reactions: Record<string, string[]> = {
            ...(message.metadata?.reactions ?? {}),
          }

          const userIds = reactions[emoji] ?? []
          const idx = userIds.indexOf(session.uid)

          if (idx >= 0) {
            userIds.splice(idx, 1)
            if (userIds.length === 0) {
              delete reactions[emoji]
            } else {
              reactions[emoji] = userIds
            }
          } else {
            reactions[emoji] = [...userIds, session.uid]
          }

          // Resolve collection path to write directly
          const basePath =
            convType === 'dm' || convType === 'group'
              ? `agentbase.conversations/${conversation_id}/messages`
              : `agentbase.users/${session.uid}/conversations/${conversation_id}/messages`

          await setDocument(
            basePath,
            params.messageId,
            { metadata: { reactions } },
            { merge: true },
          )

          return Response.json({ reactions })
        } catch (error) {
          log.error({ err: error }, 'POST reaction failed')
          return Response.json(
            { error: 'Failed to toggle reaction' },
            { status: 500 },
          )
        }
      },
    },
  },
})
