import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { buildProfileMap } from '@/lib/profile-map'
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

        console.log('[api/conversations] conversations loaded', JSON.stringify({ conversationCount: conversations.length, sample: conversations.slice(0, 2).map(c => ({ id: c.id, type: c.type, title: c.title, participant_user_ids: c.participant_user_ids })) }))
        const allParticipantIds = [...new Set(conversations.flatMap((c) => c.participant_user_ids ?? []))]
        console.log('[api/conversations] resolving profiles', JSON.stringify({ allParticipantIds, count: allParticipantIds.length }))
        const profiles = await buildProfileMap(allParticipantIds)
        console.log('[api/conversations] profiles resolved', JSON.stringify({ profileCount: Object.keys(profiles).length, profiles }))

        return Response.json({ conversations, profiles })
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

        const { type, participant_ids, title, created_by } = body

        if (!type || !participant_ids || !Array.isArray(participant_ids)) {
          return Response.json(
            { error: 'Missing required fields: type, participant_ids' },
            { status: 400 },
          )
        }

        if (type === 'dm' && participant_ids?.length === 2) {
          const existing = await ConversationDatabaseService.findDmByParticipants(
            participant_ids[0], participant_ids[1]
          )
          if (existing) {
            log.debug({ conversationId: existing.id }, 'returning existing DM')
            const profiles = await buildProfileMap(existing.participant_user_ids ?? [])
            return Response.json({ conversation: existing, profiles }, { status: 200 })
          }
        }

        try {
          const conversation = await ConversationDatabaseService.createConversation({
            type,
            participant_user_ids: participant_ids,
            title,
            created_by: created_by ?? session.uid,
          })
          log.debug({ conversationId: conversation.id }, 'created conversation')

          await syncConversationToAlgolia(conversation)

          const profiles = await buildProfileMap(conversation.participant_user_ids ?? [])
          return Response.json({ conversation, profiles }, { status: 201 })
        } catch (err) {
          log.error({ err }, 'create failed')
          return Response.json({ error: 'Failed to create conversation', detail: String(err) }, { status: 500 })
        }
      },
    },
  },
})
