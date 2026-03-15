import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { getRememberSvcClient } from '@/lib/remember-sdk'

export const Route = createFileRoute('/api/spaces/feed')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        // The Void is public — allow anonymous access with a guest userId
        const userId = session?.uid ?? 'anonymous'

        const url = new URL(request.url)
        const algorithm = url.searchParams.get('algorithm') ?? 'smart'
        const query = url.searchParams.get('query') ?? '*'
        const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
        const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
        const spacesParam = url.searchParams.get('spaces') ?? 'the_void'
        const spaces = spacesParam.split(',').map((s) => (s === 'public' ? 'the_void' : s))

        try {
          const svc = await getRememberSvcClient()
          const baseInput = { query, limit, offset, spaces }

          let res
          switch (algorithm) {
            case 'chronological':
              res = await svc.spaces.byTime(userId, { ...baseInput, direction: 'desc' })
              break
            case 'rating':
              res = await svc.spaces.byRating(userId, baseInput)
              break
            case 'significance':
              res = await svc.spaces.byProperty(userId, {
                ...baseInput,
                sort_field: 'total_significance',
                sort_direction: 'desc',
              })
              break
            case 'discovery':
            case 'smart':
            default:
              res = await svc.spaces.search(userId, baseInput)
              break
          }

          const data = res.throwOnError() as any
          return Response.json({
            memories: data.memories ?? [],
            total: data.total ?? 0,
            hasMore: (data.memories?.length ?? 0) >= limit,
            limit,
            offset,
          })
        } catch (error: any) {
          console.error('[spaces/feed]', error.message)
          return Response.json({ memories: [], total: 0, hasMore: false, limit, offset })
        }
      },
    },
  },
})
