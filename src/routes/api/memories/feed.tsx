import { createAPIFileRoute } from '@tanstack/start/api'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'
import type { MemoryFeedAlgorithm, MemoryScope } from '@/types/memories'

const VALID_ALGORITHMS: MemoryFeedAlgorithm[] = ['smart', 'chronological', 'discovery', 'rating', 'significance']
const VALID_SCOPES: (MemoryScope | 'all')[] = ['personal', 'groups', 'spaces', 'friends', 'all']

export const APIRoute = createAPIFileRoute('/api/memories/feed')({
  GET: async ({ request }) => {
    initFirebaseAdmin()

    const session = await getServerSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const algorithmParam = url.searchParams.get('algorithm') ?? 'smart'
    const algorithm: MemoryFeedAlgorithm = VALID_ALGORITHMS.includes(algorithmParam as MemoryFeedAlgorithm)
      ? (algorithmParam as MemoryFeedAlgorithm)
      : 'smart'
    const scopeParam = url.searchParams.get('scope') ?? 'all'
    const scope: MemoryScope | 'all' = VALID_SCOPES.includes(scopeParam as MemoryScope | 'all')
      ? (scopeParam as MemoryScope | 'all')
      : 'all'
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 1), 50)
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
    const query = url.searchParams.get('query') ?? null

    try {
      const result = await MemoryDatabaseService.getFeed(session.uid, {
        algorithm,
        scope,
        query,
        limit,
        offset,
      })

      return Response.json({
        memories: result.memories,
        total: result.total,
        hasMore: result.hasMore,
        limit,
        offset,
      })
    } catch (error) {
      console.error('[API] Memory feed error:', error)
      return Response.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 },
      )
    }
  },
})
