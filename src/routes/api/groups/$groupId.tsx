import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'

export const Route = createFileRoute('/api/groups/$groupId')({
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
          const group = await GroupDatabaseService.getGroup(groupId)
          if (!group) {
            return Response.json({ error: 'Group not found' }, { status: 404 })
          }
          return Response.json(group)
        } catch (error) {
          console.error('[api/groups/$groupId] GET error:', error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 },
          )
        }
      },

      PATCH: async ({ request, params }: { request: Request; params: { groupId: string } }) => {
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
          const body = await request.json() as any
          const { name, description, is_discoverable } = body

          await GroupDatabaseService.updateGroup(groupId, {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(is_discoverable !== undefined && { is_discoverable }),
          })

          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/groups/$groupId] PATCH error:', error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 },
          )
        }
      },

      DELETE: async ({ request, params }: { request: Request; params: { groupId: string } }) => {
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
          // Verify the user is the owner before deleting
          const group = await GroupDatabaseService.getGroup(groupId)
          if (!group) {
            return Response.json({ error: 'Group not found' }, { status: 404 })
          }
          if (group.created_by !== session.uid) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }

          // Remove all members first, then delete the group
          const members = await GroupDatabaseService.listMembers(groupId)
          for (const member of members) {
            await GroupDatabaseService.removeMember(groupId, member.user_id)
          }

          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/groups/$groupId] DELETE error:', error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 },
          )
        }
      },
    },
  },
})
