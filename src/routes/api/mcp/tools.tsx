import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'

const TOOL_REGISTRY = [
  {
    name: 'memory-search',
    description: 'Search memories using hybrid vector + keyword search',
    server: 'remember-enterprise',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        limit: { type: 'number', description: 'Maximum number of results to return', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory-save',
    description: 'Save a new memory',
    server: 'remember-enterprise',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Memory content text' },
        title: { type: 'string', description: 'Optional title for the memory' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to categorize the memory' },
        scope: { type: 'string', enum: ['personal', 'group'], description: 'Visibility scope', default: 'personal' },
        group_id: { type: 'string', description: 'Group ID if scope is group' },
      },
      required: ['content'],
    },
  },
]

export const Route = createFileRoute('/api/mcp/tools')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return Response.json({ tools: TOOL_REGISTRY })
      },
    },
  },
})
