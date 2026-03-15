import { createAPIFileRoute } from '@tanstack/start/api'
import { getServerSession } from '@/lib/auth/session'
import { getUnreadCount } from '@/services/notification.service'

export const APIRoute = createAPIFileRoute('/api/notifications/unread-count')({
  GET: async ({ request }) => {
    const session = getServerSession(request)
    if (!session) return new Response('Unauthorized', { status: 401 })

    const count = await getUnreadCount(session.uid)
    return Response.json({ count })
  },
})
