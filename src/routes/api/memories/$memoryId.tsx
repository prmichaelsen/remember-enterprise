import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const Route = createFileRoute('/api/memories/$memoryId')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const memory = await MemoryDatabaseService.getById(session.uid, params.memoryId)
          if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 })
          }

          return Response.json({ memory })
        } catch (error) {
          console.error('[API] Memory get error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

      PATCH: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as any
          const { title, content, tags, rating } = body

          const updates: Record<string, unknown> = {}
          if (title !== undefined) updates.title = title
          if (content !== undefined) updates.content = content
          if (tags !== undefined) updates.tags = tags
          if (rating !== undefined) updates.rating = rating

          if (Object.keys(updates).length === 0) {
            return Response.json({ error: 'No update fields provided' }, { status: 400 })
          }

          const memory = await MemoryDatabaseService.update(session.uid, params.memoryId, updates)
          if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 })
          }

          return Response.json({ memory })
        } catch (error) {
          console.error('[API] Memory update error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

      DELETE: async ({ request, params }: { request: Request; params: { memoryId: string } }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          await MemoryDatabaseService.delete(session.uid, params.memoryId)
          return Response.json({ deleted: true })
        } catch (error) {
          console.error('[API] Memory delete error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
