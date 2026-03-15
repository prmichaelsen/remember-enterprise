import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { RelationshipDatabaseService } from '@/services/relationship-database.service'
import type { RelationshipFlags } from '@/services/relationship-database.service'

export const Route = createFileRoute('/api/relationships/$relatedUserId')({
  server: {
    handlers: {
      /**
       * PATCH /api/relationships/:relatedUserId
       * Update relationship flags (accept friend request, block, unblock, etc.)
       * Body: Partial<RelationshipFlags>
       */
      PATCH: async ({ request, params }: { request: Request; params: { relatedUserId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const { relatedUserId } = params
          const body = await request.json() as Partial<RelationshipFlags>

          const updated = await RelationshipDatabaseService.updateRelationship(
            session.uid,
            relatedUserId,
            body,
          )

          if (!updated) {
            return Response.json({ error: 'Relationship not found' }, { status: 404 })
          }

          return Response.json({ relationship: updated })
        } catch (error) {
          console.error('[api/relationships/$relatedUserId] PATCH error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },

      /**
       * DELETE /api/relationships/:relatedUserId
       * Remove relationship (unfriend).
       */
      DELETE: async ({ request, params }: { request: Request; params: { relatedUserId: string } }) => {
        initFirebaseAdmin()

        const session = await getServerSession(request)
        if (!session || session.isAnonymous) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const { relatedUserId } = params

          const deleted = await RelationshipDatabaseService.deleteRelationship(
            session.uid,
            relatedUserId,
          )

          if (!deleted) {
            return Response.json({ error: 'Failed to delete relationship' }, { status: 500 })
          }

          return Response.json({ success: true })
        } catch (error) {
          console.error('[api/relationships/$relatedUserId] DELETE error:', error)
          return Response.json({ error: 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
