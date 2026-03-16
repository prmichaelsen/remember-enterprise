import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import type { GroupAuthLevel, GroupPermissions } from '@/types/conversations'
import { OWNER_PRESET, ADMIN_PRESET, EDITOR_PRESET, MEMBER_PRESET } from '@/types/conversations'

const AUTH_LEVEL_PRESETS: Record<GroupAuthLevel, GroupPermissions> = {
  0: OWNER_PRESET,
  1: ADMIN_PRESET,
  3: EDITOR_PRESET,
  5: MEMBER_PRESET,
}

export const Route = createFileRoute('/api/groups/$groupId/members/$userId')({
  server: {
    handlers: {
      PATCH: async ({ request, params }: { request: Request; params: { groupId: string; userId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId, userId } = params
        const body = await request.json() as any
        const { action } = body

        if (!['mute', 'unmute', 'ban', 'unban'].includes(action)) {
          return Response.json({ error: 'Invalid action. Must be mute, unmute, ban, or unban.' }, { status: 400 })
        }

        try {
          const actorMember = await GroupDatabaseService.getMember(groupId, session.uid)
          if (!actorMember) {
            return Response.json({ error: 'Forbidden: you are not a member' }, { status: 403 })
          }

          const targetMember = await GroupDatabaseService.getMember(groupId, userId)
          if (!targetMember) {
            return Response.json({ error: 'User is not a member of this group' }, { status: 404 })
          }

          // Cannot act on self
          if (session.uid === userId) {
            return Response.json({ error: 'Cannot perform this action on yourself' }, { status: 400 })
          }

          // Must outrank target
          if (actorMember.auth_level >= targetMember.auth_level) {
            return Response.json({ error: 'Forbidden: cannot modify a member of equal or higher rank' }, { status: 403 })
          }

          if (action === 'mute' || action === 'unmute') {
            if (!actorMember.permissions.can_moderate) {
              return Response.json({ error: 'Forbidden: requires can_moderate permission' }, { status: 403 })
            }
            if (action === 'mute') {
              await GroupDatabaseService.muteMember(groupId, userId)
            } else {
              await GroupDatabaseService.unmuteMember(groupId, userId)
            }
          }

          if (action === 'ban' || action === 'unban') {
            if (!actorMember.permissions.can_ban) {
              return Response.json({ error: 'Forbidden: requires can_ban permission' }, { status: 403 })
            }
            if (action === 'ban') {
              await GroupDatabaseService.banMember(groupId, userId)
              // Remove from conversation participant_user_ids
              await ConversationDatabaseService.removeParticipant(groupId, userId)
            } else {
              await GroupDatabaseService.unbanMember(groupId, userId)
              // Re-add to conversation participant_user_ids
              await ConversationDatabaseService.addParticipant(groupId, userId)
            }
          }

          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/groups/$groupId/members/$userId] PATCH error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

      PUT: async ({ request, params }: { request: Request; params: { groupId: string; userId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId, userId } = params
        const body = await request.json() as any
        const { auth_level } = body

        if (![0, 1, 3, 5].includes(auth_level)) {
          return Response.json({ error: 'Invalid auth_level. Must be 0, 1, 3, or 5.' }, { status: 400 })
        }

        try {
          const actorMember = await GroupDatabaseService.getMember(groupId, session.uid)
          if (!actorMember) {
            return Response.json({ error: 'Forbidden: you are not a member' }, { status: 403 })
          }

          if (!actorMember.permissions.can_manage_members) {
            return Response.json({ error: 'Forbidden: requires can_manage_members permission' }, { status: 403 })
          }

          const targetMember = await GroupDatabaseService.getMember(groupId, userId)
          if (!targetMember) {
            return Response.json({ error: 'User is not a member of this group' }, { status: 404 })
          }

          if (session.uid === userId) {
            return Response.json({ error: 'Cannot change your own role' }, { status: 400 })
          }

          if (targetMember.auth_level === 0) {
            return Response.json({ error: 'Cannot change the owner role' }, { status: 403 })
          }

          if (actorMember.auth_level >= targetMember.auth_level) {
            return Response.json({ error: 'Forbidden: cannot modify a member of equal or higher rank' }, { status: 403 })
          }

          if (auth_level <= actorMember.auth_level) {
            return Response.json({ error: 'Cannot promote a member to your own rank or above' }, { status: 403 })
          }

          const permissions = AUTH_LEVEL_PRESETS[auth_level as GroupAuthLevel]
          await GroupDatabaseService.updateMemberRole(groupId, userId, auth_level as GroupAuthLevel, permissions)

          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/groups/$groupId/members/$userId] PUT error:', error)
          return Response.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },

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
