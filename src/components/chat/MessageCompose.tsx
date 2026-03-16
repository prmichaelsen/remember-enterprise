/**
 * MessageCompose — text input with Enter to send, file attachment, and typing indicator.
 * Supports markdown content and file uploads via drag-and-drop or button.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import {
  validateFile,
  getSignedUploadUrl,
  uploadFile,
  type UploadProgress,
} from '@/services/upload.service'

interface MessageComposeProps {
  conversationId: string
  senderId: string
  onSend: (content: string) => void
  onTypingStart: () => void
  onTypingStop: () => void
  disabled?: boolean
}

export function MessageCompose({
  conversationId,
  senderId,
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageComposeProps) {
  const t = useTheme()
  const [content, setContent] = useState('')
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [content])

  // Typing indicator with 300ms debounce
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTypingStart()
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
    }

    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTypingStop()
    }, 300)
  }, [onTypingStart, onTypingStop])

  // Cleanup typing timer
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
      if (isTypingRef.current) {
        onTypingStop()
      }
    }
  }, [onTypingStop])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    handleTyping()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd+Enter or Shift+Enter to send, plain Enter for newline
    if (e.key === 'Enter' && (e.metaKey || e.shiftKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = content.trim()
    if (!trimmed) return

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false
      onTypingStop()
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }

    onSend(trimmed)
    setContent('')
    setUploads([])

    // Refocus textarea
    textareaRef.current?.focus()
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setUploads((prev) => [
          ...prev,
          {
            file_key: crypto.randomUUID(),
            file_name: file.name,
            progress: 0,
            status: 'error',
            error: validation.error,
          },
        ])
        continue
      }

      const fileKey = crypto.randomUUID()
      setUploads((prev) => [
        ...prev,
        { file_key: fileKey, file_name: file.name, progress: 0, status: 'uploading' },
      ])

      try {
        const signedUrl = await getSignedUploadUrl({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          conversation_id: conversationId,
          sender_id: senderId,
        })

        await uploadFile(
          file,
          signedUrl.upload_url,
          (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.file_key === fileKey ? { ...u, progress } : u
              )
            )
          }
        )

        setUploads((prev) =>
          prev.map((u) =>
            u.file_key === fileKey ? { ...u, progress: 100, status: 'complete' } : u
          )
        )
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file_key === fileKey
              ? { ...u, status: 'error', error: 'Upload failed' }
              : u
          )
        )
      }
    }
  }

  function removeUpload(fileKey: string) {
    setUploads((prev) => prev.filter((u) => u.file_key !== fileKey))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const hasContent = content.trim().length > 0
  const hasActiveUploads = uploads.some((u) => u.status === 'uploading')

  return (
    <div
      className={`${t.border} border-l-0 border-r-0 border-b-0`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
          <div className={`px-6 py-4 rounded-xl ${t.card}`}>
            <p className={`text-sm font-medium ${t.textPrimary}`}>
              Drop files to upload
            </p>
          </div>
        </div>
      )}

      {/* Upload previews */}
      {uploads.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {uploads.map((upload) => (
            <div
              key={upload.file_key}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${t.elevated}`}
            >
              <span className={`truncate max-w-[120px] ${t.textSecondary}`}>
                {upload.file_name}
              </span>

              {upload.status === 'uploading' && (
                <span className={`text-xs ${t.textMuted}`}>{upload.progress}%</span>
              )}
              {upload.status === 'complete' && (
                <span className={`text-xs ${t.badgeSuccess} px-1 rounded`}>Done</span>
              )}
              {upload.status === 'error' && (
                <span className={`text-xs ${t.badgeDanger} px-1 rounded`} title={upload.error}>
                  Error
                </span>
              )}

              <button
                type="button"
                onClick={() => removeUpload(upload.file_key)}
                className={`p-0.5 rounded ${t.buttonGhost}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={`p-2 rounded-lg shrink-0 ${t.buttonGhost} disabled:opacity-50`}
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-lg px-3 py-2 text-sm ${t.input} ${t.inputFocus} outline-none disabled:opacity-50`}
          style={{ maxHeight: '200px' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !hasContent || hasActiveUploads}
          className={`p-2 rounded-lg shrink-0 ${t.buttonPrimary} disabled:opacity-50`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
