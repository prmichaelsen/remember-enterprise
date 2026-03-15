import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { DmLinkService } from '@/services/dm-link.service'

export const Route = createFileRoute('/api/dm-links/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const link = await DmLinkService.generateDmLink(session.uid)
          return Response.json({ link }, { status: 201 })
        } catch (error) {
          console.error('[api/dm-links] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
