import { createAPIFileRoute } from '@tanstack/start/api'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const APIRoute = createAPIFileRoute('/api/memories')({
  POST: async ({ request }) => {
    initFirebaseAdmin()

    const session = await getServerSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const body = await request.json()
      const { content, title, tags, scope, group_id, source_message_id } = body

      if (!content || typeof content !== 'string') {
        return Response.json({ error: 'content is required' }, { status: 400 })
      }

      const memory = await MemoryDatabaseService.save({
        content,
        title: title ?? null,
        tags: Array.isArray(tags) ? tags : [],
        scope: scope ?? 'personal',
        group_id: group_id ?? null,
        source_message_id: source_message_id ?? null,
        author_id: session.uid,
        author_name: session.displayName ?? 'Unknown',
      })

      return Response.json({ memory })
    } catch (error) {
      console.error('[API] Memory save error:', error)
      return Response.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 },
      )
    }
  },
})
