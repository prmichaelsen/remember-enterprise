import { createAPIFileRoute } from '@tanstack/start/api'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'

export const APIRoute = createAPIFileRoute('/api/conversations')({
  GET: async ({ request }) => {
    initFirebaseAdmin()

    const session = await getServerSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
    const type = url.searchParams.get('type') // 'all' | 'dm' | 'group' | 'solo'

    let conversations
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

    return Response.json({ conversations })
  },
})
