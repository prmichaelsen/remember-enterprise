import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'

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
          // ACL: check the requesting user is a member with can_read
          const canRead = await GroupDatabaseService.checkPermission(groupId, session.uid, 'can_read')
          if (!canRead) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }

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
          // ACL: only admins (can_manage_members) can update group metadata
          const canManage = await GroupDatabaseService.checkPermission(groupId, session.uid, 'can_manage_members')
          if (!canManage) {
            return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 })
          }

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
          // ACL: only the owner can delete the group
          const group = await GroupDatabaseService.getGroup(groupId)
          if (!group) {
            return Response.json({ error: 'Group not found' }, { status: 404 })
          }
          if (group.created_by !== session.uid) {
            return Response.json({ error: 'Forbidden: only the group owner can delete it' }, { status: 403 })
          }

          // Remove all members first, then delete the group and conversation docs
          const members = await GroupDatabaseService.listMembers(groupId)
          for (const member of members) {
            await GroupDatabaseService.removeMember(groupId, member.user_id)
          }
          await GroupDatabaseService.deleteGroup(groupId)
          await ConversationDatabaseService.deleteConversation(groupId)

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
