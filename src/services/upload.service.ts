/**
 * Upload Service — signed URL generation, file metadata, upload tracking.
 * Cloud Storage calls are stubbed; interface is fully defined.
 */

interface FileAttachmentRecord {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail_url: string | null
}

export interface UploadRequest {
  file_name: string
  file_type: string
  file_size: number
  conversation_id: string
  sender_id: string
}

export interface SignedUploadUrl {
  upload_url: string
  file_key: string
  expires_at: string
}

export interface UploadProgress {
  file_key: string
  file_name: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

/**
 * Maximum file sizes by category.
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  document: 25 * 1024 * 1024, // 25 MB
  default: 25 * 1024 * 1024, // 25 MB
} as const

/**
 * Allowed MIME types for upload.
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  // Video
  'video/mp4',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
] as const

/**
 * Check if a file type is an image.
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Get the file category from MIME type.
 */
export function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'document' | 'default' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType.startsWith('application/') ||
    mimeType.startsWith('text/')
  )
    return 'document'
  return 'default'
}

/**
 * Validate a file for upload (size and type checks).
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { valid: false, error: `File type "${file.type}" is not allowed` }
  }

  const category = getFileCategory(file.type)
  const maxSize = FILE_SIZE_LIMITS[category]

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: `File size exceeds ${maxMB} MB limit for ${category} files`,
    }
  }

  return { valid: true }
}

/**
 * Request a signed upload URL from the server.
 */
export async function getSignedUploadUrl(
  request: UploadRequest
): Promise<SignedUploadUrl> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: 'Upload request failed' }))) as any
    throw new Error(body.error ?? `Upload request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Upload a file using the signed URL, with progress tracking.
 */
export async function uploadFile(
  file: File,
  signedUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress?.(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(signedUrl.split('?')[0]) // Return the clean file URL
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}

/**
 * Create an attachment record from an uploaded file.
 */
export function createAttachmentFromFile(
  file: File,
  uploadedUrl: string,
  thumbnailUrl?: string
): FileAttachmentRecord {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: uploadedUrl,
    thumbnail_url: thumbnailUrl ?? null,
  }
}

/**
 * Generate a thumbnail URL for an image.
 * In production, this would use a CDN transform or server-side resize.
 */
export function getThumbnailUrl(
  originalUrl: string,
  width = 200,
  height = 200
): string {
  // Stub: In production, append resize params or use CDN transform
  // e.g., `${originalUrl}?w=${width}&h=${height}&fit=cover`
  return `${originalUrl}?thumbnail=true&w=${width}&h=${height}`
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
