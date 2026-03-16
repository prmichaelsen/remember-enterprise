/**
 * FileAttachmentPreview — inline rendering of message attachments.
 * Images display as constrained thumbnails with click-to-expand.
 * Non-image files display as a download link with a file-type icon.
 */

import { Download, Maximize2, Image, FileText, Film, Music, File } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import {
  isImageType,
  formatFileSize,
  getFileCategory,
} from '@/services/upload.service'
interface FileAttachmentData {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail_url: string | null
}

/* ------------------------------------------------------------------ */
/*  FileAttachmentPreview                                              */
/* ------------------------------------------------------------------ */

interface FileAttachmentPreviewProps {
  attachment: FileAttachmentData
  /** Called when the user clicks an image to expand it. */
  onImageClick?: (url: string) => void
}

/**
 * Renders a single attachment: image thumbnail or file download link.
 */
export function FileAttachmentPreview({
  attachment,
  onImageClick,
}: FileAttachmentPreviewProps) {
  const t = useTheme()

  if (isImageType(attachment.type)) {
    return (
      <div className="relative group inline-block">
        <img
          src={attachment.thumbnail_url ?? attachment.url}
          alt={attachment.name}
          className="max-w-xs max-h-60 rounded-lg cursor-pointer object-cover"
          onClick={() => onImageClick?.(attachment.url)}
          loading="lazy"
        />
        {/* Expand button overlay */}
        <button
          type="button"
          onClick={() => onImageClick?.(attachment.url)}
          className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Expand image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {/* Size badge */}
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
            {formatFileSize(attachment.size)}
          </span>
        </div>
      </div>
    )
  }

  // Non-image file — download link with icon
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${t.elevated} ${t.hover} transition-colors`}
    >
      <FileTypeIcon mimeType={attachment.type} fileName={attachment.name} />
      <div className="min-w-0">
        <p className={`text-sm truncate ${t.textPrimary}`}>{attachment.name}</p>
        <p className={`text-xs ${t.textMuted}`}>{formatFileSize(attachment.size)}</p>
      </div>
      <Download className={`w-4 h-4 shrink-0 ${t.textMuted}`} />
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  AttachmentList — renders a list of attachments within a message    */
/* ------------------------------------------------------------------ */

interface AttachmentListProps {
  attachments: FileAttachmentData[]
  onImageClick?: (url: string) => void
}

/**
 * Renders multiple attachments in a vertical stack.
 */
export function AttachmentList({ attachments, onImageClick }: AttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => (
        <FileAttachmentPreview
          key={attachment.id}
          attachment={attachment}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pending attachment preview (before message is sent)                */
/* ------------------------------------------------------------------ */

interface PendingAttachmentPreviewProps {
  attachment: FileAttachmentData
  onRemove: () => void
}

/**
 * Shows a small preview of an attachment that's been uploaded but not yet sent.
 * Used in the compose area to let users review before sending.
 */
export function PendingAttachmentPreview({
  attachment,
  onRemove,
}: PendingAttachmentPreviewProps) {
  const t = useTheme()

  return (
    <div
      className={`relative inline-block rounded-lg overflow-hidden ${t.borderSubtle}`}
    >
      {isImageType(attachment.type) ? (
        <img
          src={attachment.thumbnail_url ?? attachment.url}
          alt={attachment.name}
          className="w-16 h-16 object-cover"
        />
      ) : (
        <div
          className={`w-16 h-16 flex flex-col items-center justify-center gap-1 ${t.elevated}`}
        >
          <FileTypeIcon mimeType={attachment.type} fileName={attachment.name} />
          <span className={`text-[9px] truncate max-w-[56px] ${t.textMuted}`}>
            {attachment.name}
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
        aria-label={`Remove ${attachment.name}`}
      >
        <span className="text-[10px] leading-none">&times;</span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FileTypeIcon                                                       */
/* ------------------------------------------------------------------ */

function FileTypeIcon({
  mimeType,
  fileName,
}: {
  mimeType: string
  fileName: string
}) {
  const t = useTheme()
  const category = mimeType ? getFileCategory(mimeType) : guessCategory(fileName)
  const iconClass = `w-5 h-5 shrink-0 ${t.textSecondary}`

  switch (category) {
    case 'image':
      return <Image className={iconClass} />
    case 'video':
      return <Film className={iconClass} />
    default:
      if (mimeType?.startsWith('audio/') || fileName.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return <Music className={iconClass} />
      }
      if (mimeType?.startsWith('text/') || fileName.match(/\.(txt|csv|md|json)$/i)) {
        return <FileText className={iconClass} />
      }
      return <File className={iconClass} />
  }
}

function guessCategory(fileName: string): 'image' | 'video' | 'document' | 'default' {
  if (fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image'
  if (fileName.match(/\.(mp4|webm|mov|avi)$/i)) return 'video'
  if (fileName.match(/\.(pdf|doc|docx|xls|xlsx|txt|csv)$/i)) return 'document'
  return 'default'
}
