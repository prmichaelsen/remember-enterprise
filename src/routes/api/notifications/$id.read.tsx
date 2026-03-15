import { createAPIFileRoute } from '@tanstack/start/api'
import { getServerSession } from '@/lib/auth/session'
import { markAsRead } from '@/services/notification.service'

export const APIRoute = createAPIFileRoute('/api/notifications/$id/read')({
  POST: async ({ request, params }) => {
    const session = getServerSession(request)
    if (!session) return new Response('Unauthorized', { status: 401 })

    const result = await markAsRead(params.id)
    if (!result) return new Response('Not found', { status: 404 })
    return Response.json(result)
  },
})
