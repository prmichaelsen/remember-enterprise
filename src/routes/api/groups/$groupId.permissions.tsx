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

          // ACL: users can only check their own permissions unless they have can_manage_members
          if (userId !== session.uid) {
            const canManage = await GroupDatabaseService.checkPermission(groupId, session.uid, 'can_manage_members')
            if (!canManage) {
              return Response.json({ error: 'Forbidden: cannot check other users\' permissions' }, { status: 403 })
            }
          }

          // If a specific permission is requested, return { allowed: boolean }
          if (permission) {
            const validPermissions: (keyof GroupPermissions)[] = [
              'can_read', 'can_publish', 'can_manage_members',
              'can_moderate', 'can_kick', 'can_ban',
            ]
            if (!validPermissions.includes(permission)) {
              return Response.json({ error: `Invalid permission: ${permission}` }, { status: 400 })
            }

            const allowed = await GroupDatabaseService.checkPermission(groupId, userId, permission)
            return Response.json({ allowed })
          }

          // No specific permission requested — return the full permission object for the user
          const members = await GroupDatabaseService.listMembers(groupId)
          const member = members.find((m) => m.user_id === userId)

          if (!member) {
            return Response.json({ error: 'User is not a member of this group' }, { status: 404 })
          }

          return Response.json({
            user_id: member.user_id,
            auth_level: member.auth_level,
            permissions: member.permissions,
          })
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
