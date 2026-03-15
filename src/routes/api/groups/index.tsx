import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'

export const Route = createFileRoute('/api/groups/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as any
          const { name, description, invited_user_ids } = body

          if (!name || typeof name !== 'string') {
            return Response.json({ error: 'name is required' }, { status: 400 })
          }

          const result = await GroupDatabaseService.createGroup({
            name,
            description: description ?? undefined,
            created_by: session.uid,
            invited_user_ids: Array.isArray(invited_user_ids) ? invited_user_ids : [],
          })

          return Response.json({
            conversation: result.group,
            members: result.members,
          })
        } catch (error) {
          console.error('[api/groups] POST error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
