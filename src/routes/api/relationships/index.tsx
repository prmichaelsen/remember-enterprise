import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { RelationshipDatabaseService } from '@/services/relationship-database.service'
import type { RelationshipFlags } from '@/services/relationship-database.service'

export const Route = createFileRoute('/api/relationships/')({
  server: {
    handlers: {
      /**
       * GET /api/relationships?flag=friend&value=true&limit=50
       * List relationships for the current user, optionally filtered by flag.
       */
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const url = new URL(request.url)
          const flag = url.searchParams.get('flag') as keyof RelationshipFlags | null
          const value = url.searchParams.get('value')
          const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)

          const filter = flag && value !== null
            ? { flag, value: value === 'true' }
            : undefined

          const relationships = await RelationshipDatabaseService.listRelationships(
            session.uid,
            filter,
            limit,
          )

          return Response.json({ relationships })
        } catch (error) {
          console.error('[api/relationships] GET error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },

      /**
       * POST /api/relationships
       * Create a new relationship (send friend request).
       * Body: { related_user_id: string }
       */
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as { related_user_id?: string }
          const { related_user_id } = body

          if (!related_user_id) {
            return Response.json({ error: 'related_user_id is required' }, { status: 400 })
          }

          if (related_user_id === session.uid) {
            return Response.json({ error: 'Cannot create relationship with yourself' }, { status: 400 })
          }

          const existing = await RelationshipDatabaseService.getRelationship(
            session.uid,
            related_user_id,
          )
          if (existing) {
            return Response.json({ error: 'Relationship already exists' }, { status: 409 })
          }

          const relationship = await RelationshipDatabaseService.createRelationship(
            session.uid,
            related_user_id,
            { pending_friend: true, initiated_by: session.uid },
          )

          return Response.json({ relationship }, { status: 201 })
        } catch (error) {
          console.error('[api/relationships] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
