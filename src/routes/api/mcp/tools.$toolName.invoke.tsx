import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { MemoryDatabaseService } from '@/services/memory-database.service'

export const Route = createFileRoute('/api/mcp/tools/$toolName/invoke')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { toolName: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { toolName } = params
        if (!toolName) {
          return Response.json({ error: 'toolName is required' }, { status: 400 })
        }

        try {
          const body = await request.json()
          const args = body.args ?? {}

          let data: unknown

          switch (toolName) {
            case 'memory-search': {
              const query = args.query as string
              if (!query || typeof query !== 'string') {
                return Response.json({ error: 'args.query is required' }, { status: 400 })
              }
              const limit = typeof args.limit === 'number' ? args.limit : 10
              data = await MemoryDatabaseService.search(session.uid, query, limit)
              break
            }

            case 'memory-save': {
              const content = args.content as string
              if (!content || typeof content !== 'string') {
                return Response.json({ error: 'args.content is required' }, { status: 400 })
              }
              data = await MemoryDatabaseService.save({
                content,
                title: args.title ?? null,
                tags: Array.isArray(args.tags) ? args.tags : [],
                scope: args.scope ?? 'personal',
                group_id: args.group_id ?? null,
                source_message_id: null,
                author_id: session.uid,
                author_name: session.displayName ?? 'Unknown',
              })
              break
            }

            default:
              return Response.json({ error: `Unknown tool: ${toolName}` }, { status: 404 })
          }

          return Response.json({ result: data, tool: toolName })
        } catch (error) {
          console.error(`[api/mcp/tools/${toolName}/invoke] POST error:`, error)
          return Response.json(
            { error: 'Tool invocation failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
