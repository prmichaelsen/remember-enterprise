import { createFileRoute } from '@tanstack/react-router'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const Route = createFileRoute('/api/memories/$memoryId/rate')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const memory = await MemoryDatabaseService.getById(session.uid, params.memoryId)
          if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 })
          }

          return Response.json({ memoryId: memory.id, rating: memory.rating })
        } catch (error) {
          console.error('[API] Get rating error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

      POST: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as any
          const { rating } = body

          if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return Response.json(
              { error: 'rating must be an integer between 1 and 5' },
              { status: 400 },
            )
          }

          const memory = await MemoryDatabaseService.update(session.uid, params.memoryId, { rating })
          if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 })
          }

          return Response.json({ memoryId: memory.id, rating: memory.rating })
        } catch (error) {
          console.error('[API] Set rating error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

      DELETE: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const memory = await MemoryDatabaseService.update(session.uid, params.memoryId, { rating: null as any })
          if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 })
          }

          return Response.json({ memoryId: memory.id, rating: null })
        } catch (error) {
          console.error('[API] Remove rating error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
