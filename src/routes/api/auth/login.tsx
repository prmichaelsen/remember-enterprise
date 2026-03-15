import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { createSessionCookie, buildSessionCookieHeader } from '@/lib/auth/session'
import { verifyIdToken } from '@prmichaelsen/firebase-admin-sdk-v8'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        try {
          const { idToken } = await request.json()
          if (!idToken) {
            return new Response(JSON.stringify({ error: 'Missing idToken' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          await verifyIdToken(idToken)
          const sessionCookie = await createSessionCookie(idToken)

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': buildSessionCookieHeader(sessionCookie),
            },
          })
        } catch {
          return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
