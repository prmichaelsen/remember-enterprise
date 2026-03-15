import { createAPIFileRoute } from '@tanstack/start/api'
import { getServerSession } from '@/lib/auth/session'
import { markAllAsRead } from '@/services/notification.service'

export const APIRoute = createAPIFileRoute('/api/notifications/read-all')({
  POST: async ({ request }) => {
    const session = getServerSession(request)
    if (!session) return new Response('Unauthorized', { status: 401 })

    const count = await markAllAsRead(session.uid)
    return Response.json({ marked: count })
  },
})
