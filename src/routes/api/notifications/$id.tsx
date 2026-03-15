import { createAPIFileRoute } from '@tanstack/start/api'
import { getServerSession } from '@/lib/auth/session'
import { deleteNotification } from '@/services/notification.service'

export const APIRoute = createAPIFileRoute('/api/notifications/$id')({
  DELETE: async ({ request, params }) => {
    const session = getServerSession(request)
    if (!session) return new Response('Unauthorized', { status: 401 })

    const deleted = await deleteNotification(params.id)
    if (!deleted) return new Response('Not found', { status: 404 })
    return Response.json({ deleted: true })
  },
})
