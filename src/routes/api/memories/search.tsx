import { createAPIFileRoute } from '@tanstack/start/api'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const APIRoute = createAPIFileRoute('/api/memories/search')({
  GET: async ({ request }) => {
    initFirebaseAdmin()

    const session = await getServerSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const query = url.searchParams.get('query') ?? ''
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 1), 50)

    if (!query.trim()) {
      return Response.json({ memories: [], total: 0, hasMore: false, limit, offset: 0 })
    }

    try {
      const memories = await MemoryDatabaseService.search(session.uid, query, limit)

      return Response.json({
        memories,
        total: memories.length,
        hasMore: memories.length === limit,
        limit,
        offset: 0,
      })
    } catch (error) {
      console.error('[API] Memory search error:', error)
      return Response.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 },
      )
    }
  },
})
