import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { NotificationDatabaseService } from '@/services/notification-database.service'

export const Route = createFileRoute('/api/notifications/unread-count')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)
        if (!session) return new Response('Unauthorized', { status: 401 })

        const count = await NotificationDatabaseService.getUnreadCount(session.uid)
        return Response.json({ count })
      },
    },
  },
})
