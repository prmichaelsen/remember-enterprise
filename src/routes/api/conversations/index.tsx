import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'

export const Route = createFileRoute('/api/conversations/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        console.log('[api/conversations] GET hit')

        initFirebaseAdmin()

        const cookieHeader = request.headers.get('cookie')
        console.log('[api/conversations] cookie header present:', !!cookieHeader)
        if (cookieHeader) {
          const cookieNames = cookieHeader.split(';').map(c => c.trim().split('=')[0])
          console.log('[api/conversations] cookie names:', cookieNames)
        }

        let session
        try {
          session = await getServerSession(request)
          console.log('[api/conversations] session result:', session ? { uid: session.uid, email: session.email } : null)
        } catch (err) {
          console.error('[api/conversations] getServerSession threw:', err)
          return Response.json({ error: 'Auth error', detail: String(err) }, { status: 500 })
        }

        if (!session) {
          console.log('[api/conversations] no session — returning 401')
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
        const type = url.searchParams.get('type')

        console.log('[api/conversations] fetching conversations for', session.uid, 'type:', type, 'limit:', limit)

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
          console.log('[api/conversations] found', conversations.length, 'conversations')
        } catch (err) {
          console.error('[api/conversations] database query failed:', err)
          return Response.json({ error: 'Database error', detail: String(err) }, { status: 500 })
        }

        return Response.json({ conversations })
      },

      POST: async ({ request }: { request: Request }) => {
        console.log('[api/conversations] POST hit')

        initFirebaseAdmin()

        let session
        try {
          session = await getServerSession(request)
        } catch (err) {
          console.error('[api/conversations] getServerSession threw:', err)
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
          console.log('[api/conversations] created conversation:', conversation.id)
          return Response.json(conversation, { status: 201 })
        } catch (err) {
          console.error('[api/conversations] create failed:', err)
          return Response.json({ error: 'Failed to create conversation', detail: String(err) }, { status: 500 })
        }
      },
    },
  },
})
