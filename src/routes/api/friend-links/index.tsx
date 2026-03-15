import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { FriendLinkService } from '@/services/friend-link.service'
import { z } from 'zod'

const GenerateLinkSchema = z.object({
  expires_in_hours: z.number().positive().optional(),
  max_uses: z.number().int().positive().optional(),
})

export const Route = createFileRoute('/api/friend-links/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json()
          const parsed = GenerateLinkSchema.safeParse(body)

          if (!parsed.success) {
            return Response.json(
              { error: 'Invalid request body', details: parsed.error.issues },
              { status: 400 },
            )
          }

          const link = await FriendLinkService.generateFriendLink(session.uid, parsed.data)
          return Response.json({ link }, { status: 201 })
        } catch (error) {
          console.error('[api/friend-links] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
