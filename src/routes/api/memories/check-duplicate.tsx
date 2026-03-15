import { createFileRoute } from '@tanstack/react-router'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const Route = createFileRoute('/api/memories/check-duplicate')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as any
          const { content, conversation_id } = body

          if (!content || typeof content !== 'string') {
            return Response.json({ error: 'content is required' }, { status: 400 })
          }

          // Use search to find similar memories and check for duplicates
          const similar = await MemoryDatabaseService.search(session.uid, content, 5)
          const duplicate = similar.find(
            (m) => m.content.trim().toLowerCase() === content.trim().toLowerCase(),
          )

          return Response.json({
            isDuplicate: !!duplicate,
            existingMemoryId: duplicate?.id ?? null,
            similarMemories: similar.map((m) => ({
              id: m.id,
              title: m.title,
              content: m.content,
            })),
          })
        } catch (error) {
          console.error('[API] Duplicate check error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
