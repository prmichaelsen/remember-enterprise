import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { syncConversationToAlgolia } from '@/lib/algolia-sync'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/conversations')

export const Route = createFileRoute('/api/conversations/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        log.debug('GET hit')

        initFirebaseAdmin()

        const cookieHeader = request.headers.get('cookie')
        log.debug({ present: !!cookieHeader }, 'cookie header present')
        if (cookieHeader) {
          const cookieNames = cookieHeader.split(';').map(c => c.trim().split('=')[0])
          log.debug({ cookieNames }, 'cookie names')
        }

        let session
        try {
          session = await getServerSession(request)
          log.debug({ session: session ? { uid: session.uid, email: session.email } : null }, 'session result')
        } catch (err) {
          log.error({ err }, 'getServerSession threw')
          return Response.json({ error: 'Auth error', detail: String(err) }, { status: 500 })
        }

        if (!session) {
          log.debug('no session — returning 401')
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
        const type = url.searchParams.get('type')

        log.debug({ uid: session.uid, type, limit }, 'fetching conversations')

        let conversations
        try {
          switch (type) {
            case 'dm':
              conversations = await ConversationDatabaseService.getUserDMs(session.uid, limit)
              break
            case 'group':
              conversations = await ConversationDatabaseService.getUserGroups(session.uid, limit)
              break
            case 'solo':
              conversations = await ConversationDatabaseService.getUserConversations(session.uid, limit)
              break
            default:
              conversations = await ConversationDatabaseService.getAllConversations(session.uid, limit)
          }
          log.debug({ count: conversations.length }, 'found conversations')
        } catch (err) {
          log.error({ err }, 'database query failed')
          return Response.json({ error: 'Database error', detail: String(err) }, { status: 500 })
        }

        return Response.json({ conversations })
      },

      POST: async ({ request }: { request: Request }) => {
        log.debug('POST hit')

        initFirebaseAdmin()

        let session
        try {
          session = await getServerSession(request)
        } catch (err) {
          log.error({ err }, 'getServerSession threw')
          return Response.json({ error: 'Auth error', detail: String(err) }, { status: 500 })
        }

        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { type, participant_ids, name, description, created_by } = body

        if (!type || !participant_ids || !Array.isArray(participant_ids)) {
          return Response.json(
            { error: 'Missing required fields: type, participant_ids' },
            { status: 400 },
          )
        }

        try {
          const conversation = await ConversationDatabaseService.createConversation({
            type,
            participant_user_ids: participant_ids,
            name,
            description,
            created_by: created_by ?? session.uid,
          })
          log.debug({ conversationId: conversation.id }, 'created conversation')

          await syncConversationToAlgolia(conversation)

          return Response.json(conversation, { status: 201 })
        } catch (err) {
          log.error({ err }, 'create failed')
          return Response.json({ error: 'Failed to create conversation', detail: String(err) }, { status: 500 })
        }
      },
    },
  },
})
