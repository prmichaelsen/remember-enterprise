/**
 * GET /api/search — multi-index Algolia search across people, conversations, and messages.
 * Query params: q (required), hitsPerPage (optional, default 5)
 */

import { createFileRoute } from '@tanstack/react-router'
import { getServerSession } from '@/lib/auth/session'
import { search } from '@/services/search.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/search')

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const q = url.searchParams.get('q')?.trim() ?? ''

        if (!q) {
          return Response.json({ people: [], conversations: [], messages: [], query: '' })
        }

        const hitsPerPage = Math.min(
          Math.max(parseInt(url.searchParams.get('hitsPerPage') ?? '5', 10) || 5, 1),
          20,
        )

        try {
          const result = await search(q, session.uid, hitsPerPage)
          return Response.json(result)
        } catch (error) {
          log.error({ err: error }, 'search error')
          return Response.json(
            { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
