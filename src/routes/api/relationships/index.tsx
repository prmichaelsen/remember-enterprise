import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { RelationshipDatabaseService } from '@/services/relationship-database.service'
import type { RelationshipFlags } from '@/services/relationship-database.service'
import { buildProfileMap } from '@/lib/profile-map'

export const Route = createFileRoute('/api/relationships/')({
  server: {
    handlers: {
      /**
       * GET /api/relationships?friend=true&pending_friend=false
       * List relationships for the current user, optionally filtered by flags.
       * Matches agentbase.me query param convention.
       */
      GET: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const url = new URL(request.url)
          const filters: Record<string, boolean> = {}
          for (const key of ['friend', 'pending_friend', 'blocked', 'muted', 'restricted', 'follower', 'following']) {
            const val = url.searchParams.get(key)
            if (val === 'true') filters[key] = true
            if (val === 'false') filters[key] = false
          }

          const relationships = await RelationshipDatabaseService.listRelationships(
            session.uid,
            Object.keys(filters).length > 0 ? filters : undefined,
          )

          // Enrich with profile data
          const userIds = relationships.map((r) => r.related_user_id)
          const profiles = await buildProfileMap(userIds)

          return Response.json({ relationships, maps: { profiles } })
        } catch (error) {
          console.error('[api/relationships] GET error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },

      /**
       * POST /api/relationships
       * Create a new relationship (send friend request).
       * Body: { related_user_id: string, flags?: RelationshipFlags }
       */
      POST: async ({ request }: { request: Request }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = await request.json() as { related_user_id?: string; flags?: RelationshipFlags }
          const { related_user_id, flags } = body

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
            flags ?? { pending_friend: true },
          )

          const profiles = await buildProfileMap([session.uid, related_user_id])

          return Response.json({ relationship, maps: { profiles } }, { status: 201 })
        } catch (error) {
          console.error('[api/relationships] POST error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
