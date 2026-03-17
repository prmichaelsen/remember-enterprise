import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { buildProfileMap } from '@/lib/profile-map'

export const Route = createFileRoute('/api/conversations/$conversationId')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        let conversation = await ConversationDatabaseService.getConversation(
          params.conversationId,
          session.uid,
        )
        if (!conversation) {
          // Lazily create synthetic conversations on first access
          const syntheticDefaults: Record<string, { title: string; type: 'chat' }> = {
            'main': { title: 'Agent', type: 'chat' },
            'ghost:space:the_void': { title: 'Ghost of the Void', type: 'chat' },
          }
          const defaults = syntheticDefaults[params.conversationId]
          if (defaults) {
            await ConversationDatabaseService.ensureUserConversation(session.uid, params.conversationId, defaults)
            conversation = await ConversationDatabaseService.getConversation(params.conversationId, session.uid)
          }
          if (!conversation) return Response.json({ error: 'Not found' }, { status: 404 })
        }
        const profiles = await buildProfileMap(conversation.participant_user_ids ?? [])
        return Response.json({ conversation, profiles })
      },
      DELETE: async ({ request, params }: { request: Request; params: { conversationId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        try {
          await ConversationDatabaseService.deleteConversation(params.conversationId)
          return Response.json({ success: true })
        } catch {
          return Response.json({ error: 'Failed to delete' }, { status: 500 })
        }
      },
    },
  },
})
