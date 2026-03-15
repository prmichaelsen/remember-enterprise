import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'

export const Route = createFileRoute('/api/groups/$groupId/members/$userId')({
  server: {
    handlers: {
      DELETE: async ({ request, params }: { request: Request; params: { groupId: string; userId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId, userId } = params
        if (!groupId || !userId) {
          return Response.json({ error: 'groupId and userId are required' }, { status: 400 })
        }

        try {
          await GroupDatabaseService.removeMember(groupId, userId)
          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/groups/$groupId/members/$userId] DELETE error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
