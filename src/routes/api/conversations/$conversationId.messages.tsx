import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MessageDatabaseService } from '@/services/message-database.service'

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
          const result = await MessageDatabaseService.listMessages(
            params.conversationId,
            limit,
            beforeCursor,
          )
          return Response.json(result)
        } catch (err) {
          console.error('[api/conversations/messages] GET failed:', err)
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

        const { content, sender_id, sender_name, sender_photo_url, attachments, visible_to_user_ids, role } = body

        if (!content && (!attachments || attachments.length === 0)) {
          return Response.json({ error: 'Message content or attachments required' }, { status: 400 })
        }

        try {
          const message = await MessageDatabaseService.sendMessage(params.conversationId, {
            sender_id: sender_id ?? session.uid,
            sender_name: sender_name ?? session.email ?? 'Unknown',
            sender_photo_url: sender_photo_url ?? null,
            content: content ?? '',
            attachments,
            visible_to_user_ids,
            role,
          })
          return Response.json(message, { status: 201 })
        } catch (err) {
          console.error('[api/conversations/messages] POST failed:', err)
          return Response.json({ error: 'Failed to send message' }, { status: 500 })
        }
      },
    },
  },
})
