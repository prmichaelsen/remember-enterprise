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
          // Allow users to leave the group themselves
          if (userId === session.uid) {
            // Check that the user is not the owner (owners cannot leave without transferring ownership)
            const group = await GroupDatabaseService.getGroup(groupId)
            if (group && group.created_by === session.uid) {
              return Response.json(
                { error: 'Forbidden: the group owner cannot leave. Transfer ownership or delete the group instead.' },
                { status: 403 },
              )
            }

            await GroupDatabaseService.removeMember(groupId, userId)
            return Response.json({ success: true })
          }

          // ACL: to remove another member, the actor needs can_kick permission
          const canKick = await GroupDatabaseService.checkPermission(groupId, session.uid, 'can_kick')
          if (!canKick) {
            return Response.json({ error: 'Forbidden: you do not have permission to remove members' }, { status: 403 })
          }

          // Verify the target is actually a member
          const members = await GroupDatabaseService.listMembers(groupId)
          const actorMember = members.find((m) => m.user_id === session.uid)
          const targetMember = members.find((m) => m.user_id === userId)

          if (!targetMember) {
            return Response.json({ error: 'User is not a member of this group' }, { status: 404 })
          }

          // Cannot kick someone at same or higher rank (lower auth_level number = higher rank)
          if (actorMember && actorMember.auth_level >= targetMember.auth_level) {
            return Response.json(
              { error: 'Forbidden: cannot remove a member of equal or higher rank' },
              { status: 403 },
            )
          }

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
