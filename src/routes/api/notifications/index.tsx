import { createAPIFileRoute } from '@tanstack/start/api'
import { getServerSession } from '@/lib/auth/session'
import { getNotifications } from '@/services/notification.service'

export const APIRoute = createAPIFileRoute('/api/notifications')({
  GET: async ({ request }) => {
    const session = getServerSession(request)
    if (!session) return new Response('Unauthorized', { status: 401 })

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)

    const notifications = await getNotifications(session.uid, { limit })
    return Response.json(notifications)
  },
})
