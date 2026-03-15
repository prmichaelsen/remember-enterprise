import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'

export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()
        const session = await getServerSession(request)

        if (!session) {
          return new Response(
            JSON.stringify({ authenticated: false, user: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ authenticated: true, user: session }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      },
    },
  },
})
