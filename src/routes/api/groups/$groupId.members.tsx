import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'
import { MEMBER_PRESET } from '@/types/conversations'
import type { GroupMember, GroupAuthLevel } from '@/types/conversations'

export const Route = createFileRoute('/api/groups/$groupId/members')({
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
          const members = await GroupDatabaseService.listMembers(groupId)
          return Response.json({ members })
        } catch (error) {
          console.error('[api/groups/$groupId/members] GET error:', error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 },
          )
        }
      },

      POST: async ({ request, params }: { request: Request; params: { groupId: string } }) => {
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
          const body = await request.json()
          const { user_id } = body

          if (!user_id || typeof user_id !== 'string') {
            return Response.json({ error: 'user_id is required' }, { status: 400 })
          }

          const member: GroupMember = {
            user_id,
            display_name: '',
            photo_url: null,
            auth_level: 5 as GroupAuthLevel,
            permissions: { ...MEMBER_PRESET },
            joined_at: new Date().toISOString(),
          }

          await GroupDatabaseService.addMember(groupId, member)
          return Response.json(member)
        } catch (error) {
          console.error('[api/groups/$groupId/members] POST error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
