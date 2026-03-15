import { createFileRoute } from '@tanstack/react-router'
import { buildClearSessionCookieHeader } from '@/lib/auth/session'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': buildClearSessionCookieHeader(request),
          },
        })
      },
    },
  },
})
