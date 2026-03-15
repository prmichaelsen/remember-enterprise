/**
 * FileUpload — drag-and-drop + button upload with progress bar and preview thumbnails.
 * FileAttachment — inline rendering for images and download links for other files.
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, Film, Music, File } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import {
  validateFile,
  isImageType,
  formatFileSize,
  getFileCategory,
  type UploadProgress,
} from '@/services/upload.service'
import type { MessageAttachment } from '@/types/conversations'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  className?: string
}

/**
 * Standalone drag-and-drop file upload zone.
 */
export function FileUploadZone({
  onFilesSelected,
  disabled = false,
  maxFiles = 10,
  className = '',
}: FileUploadProps) {
  const t = useTheme()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files).slice(0, maxFiles)
    const validFiles = files.filter((f) => validateFile(f).valid)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files).slice(0, maxFiles)
    const validFiles = files.filter((f) => validateFile(f).valid)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
    e.target.value = ''
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg
        border-2 border-dashed cursor-pointer transition-colors
        ${dragOver ? 'border-brand-primary/50 bg-brand-primary/5' : t.borderSubtle}
        ${disabled ? 'opacity-50 cursor-not-allowed' : t.hover}
        ${className}
      `}
    >
      <Upload className={`w-8 h-8 ${t.textMuted}`} />
      <p className={`text-sm ${t.textSecondary}`}>
        Drag & drop files or{' '}
        <span className="text-brand-primary font-medium">browse</span>
      </p>
      <p className={`text-xs ${t.textMuted}`}>
        Max {maxFiles} files. Images up to 10 MB, documents up to 25 MB.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
    </div>
  )
}

/**
 * Upload progress bar for a single file.
 */
export function UploadProgressBar({ upload }: { upload: UploadProgress }) {
  const t = useTheme()

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${t.elevated}`}>
      <FileTypeIcon mimeType="" fileName={upload.file_name} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${t.textPrimary}`}>{upload.file_name}</p>

        {upload.status === 'uploading' && (
          <div className="mt-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}

        {upload.status === 'error' && (
          <p className={`text-xs ${t.badgeDanger}`}>{upload.error}</p>
        )}

        {upload.status === 'complete' && (
          <p className={`text-xs ${t.badgeSuccess}`}>Uploaded</p>
        )}
      </div>

      {upload.status === 'uploading' && (
        <span className={`text-xs shrink-0 ${t.textMuted}`}>{upload.progress}%</span>
      )}
    </div>
  )
}

/**
 * FileAttachment — inline rendering for message attachments.
 * Images: constrained preview with click-to-expand. Others: download link.
 */
export function FileAttachment({
  attachment,
  onImageClick,
}: {
  attachment: MessageAttachment
  onImageClick?: (url: string) => void
}) {
  const t = useTheme()

  if (isImageType(attachment.type)) {
    return (
      <div className="relative group inline-block">
        <img
          src={attachment.thumbnail_url ?? attachment.url}
          alt={attachment.name}
          className="max-w-xs max-h-60 rounded-lg cursor-pointer object-cover"
          onClick={() => onImageClick?.(attachment.url)}
        />
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white`}>
            {formatFileSize(attachment.size)}
          </span>
        </div>
      </div>
    )
  }

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
    </a>
  )
}

/**
 * Icon selector based on file type.
 */
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
