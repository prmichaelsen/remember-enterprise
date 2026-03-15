import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { NotificationDatabaseService } from '@/services/notification-database.service'

export const Route = createFileRoute('/api/notifications/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return new Response('Unauthorized', { status: 401 })

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)

        const notifications = await NotificationDatabaseService.listByUser(session.uid, limit)
        return Response.json(notifications)
      },
    },
  },
})
