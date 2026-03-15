/**
 * /api/upload — generates signed upload URLs for file uploads.
 *
 * POST body: { file_name, file_type, file_size, conversation_id }
 * Response:  { upload_url, file_key, expires_at }
 *
 * Validates:
 * - File size (10 MB for images, 25 MB for documents, 100 MB for video)
 * - MIME type against allow-list
 * - User authentication via session cookie
 */

import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import {
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  getFileCategory,
} from '@/services/upload.service'

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
    // ---------- Auth ----------
    initFirebaseAdmin()
    const session = await getServerSession(request)
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ---------- Parse body ----------
    let body: {
      file_name?: string
      file_type?: string
      file_size?: number
      conversation_id?: string
    }

    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { file_name, file_type, file_size, conversation_id } = body

    // ---------- Validate required fields ----------
    if (!file_name || !file_type || !file_size || !conversation_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: file_name, file_type, file_size, conversation_id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ---------- Validate MIME type ----------
    if (!ALLOWED_MIME_TYPES.includes(file_type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return new Response(
        JSON.stringify({ error: `File type "${file_type}" is not allowed` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ---------- Validate file size ----------
    const category = getFileCategory(file_type)
    const maxSize = FILE_SIZE_LIMITS[category]

    if (file_size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return new Response(
        JSON.stringify({
          error: `File size exceeds ${maxMB} MB limit for ${category} files`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ---------- Generate signed URL ----------
    // In production, this would call GCS / R2 / S3 to generate a real signed PUT URL.
    // For now, generate a stub signed URL that the client can use.
    const fileKey = `uploads/${conversation_id}/${crypto.randomUUID()}/${sanitizeFileName(file_name)}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    // Stub signed URL — replace with real cloud storage signed URL in production
    const uploadUrl = `/api/uploads/${fileKey}?token=${crypto.randomUUID()}&expires=${encodeURIComponent(expiresAt)}`

    return new Response(
      JSON.stringify({
        upload_url: uploadUrl,
        file_key: fileKey,
        expires_at: expiresAt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
      },
    },
  },
})

/**
 * Sanitize file name to be safe for storage paths.
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255)
}
