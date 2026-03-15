import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/notifications-ws')({
  server: {
    handlers: {
      GET: async ({ request }) => {
    // Must be a WebSocket upgrade request
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    try {
      // Auth check — reject unauthenticated WebSocket upgrades
      initFirebaseAdmin()
      const session = await getServerSession(request)
      if (!session) {
        return new Response('Unauthorized', { status: 401 })
      }
      const userId = session.uid

      // Forward WebSocket upgrade to user's NotificationHub DO
      const notificationHubBinding = (env as any).NOTIFICATION_HUB as DurableObjectNamespace
      const id = notificationHubBinding.idFromName(userId)
      const stub = notificationHubBinding.get(id)

      // Forward the upgrade request, passing userId as a query param
      const doUrl = new URL(request.url)
      doUrl.pathname = '/websocket'
      doUrl.searchParams.set('userId', userId)

      return stub.fetch(
        new Request(doUrl.toString(), {
          headers: request.headers,
        }),
      )
    } catch {
      return new Response('Internal Server Error', { status: 500 })
    }
      },
    },
  },
})
