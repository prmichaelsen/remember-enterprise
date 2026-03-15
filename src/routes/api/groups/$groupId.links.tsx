import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GroupDatabaseService } from '@/services/group-database.service'
import { GroupLinkService } from '@/services/group-link.service'
import { z } from 'zod'

const GenerateGroupLinkSchema = z.object({
  expires_in_hours: z.number().positive().optional(),
  max_uses: z.number().int().positive().optional(),
})

export const Route = createFileRoute('/api/groups/$groupId/links')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { groupId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId } = params

        try {
          const hasPermission = await GroupDatabaseService.checkPermission(
            groupId,
            session.uid,
            'can_manage_members',
          )
          if (!hasPermission) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
          }

          const body = await request.json()
          const parsed = GenerateGroupLinkSchema.safeParse(body)

          if (!parsed.success) {
            return Response.json(
              { error: 'Invalid request body', details: parsed.error.issues },
              { status: 400 },
            )
          }

          const link = await GroupLinkService.generateGroupLink(
            session.uid,
            groupId,
            parsed.data,
          )

          return Response.json({ link }, { status: 201 })
        } catch (error) {
          console.error('[api/groups/$groupId/links] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
