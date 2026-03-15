import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'
import type { GroupPermissions } from '@/types/conversations'

export const Route = createFileRoute('/api/groups/$groupId/permissions')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { groupId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId } = params
        if (!groupId) {
          return Response.json({ error: 'groupId is required' }, { status: 400 })
        }

        try {
          const url = new URL(request.url)
          const userId = url.searchParams.get('userId') ?? url.searchParams.get('user_id') ?? session.uid
          const permission = url.searchParams.get('permission') as keyof GroupPermissions | null

          if (!permission) {
            return Response.json({ error: 'permission query param is required' }, { status: 400 })
          }

          const allowed = await GroupDatabaseService.checkPermission(groupId, userId, permission)
          return Response.json({ allowed })
        } catch (error) {
          console.error('[api/groups/$groupId/permissions] GET error:', error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
