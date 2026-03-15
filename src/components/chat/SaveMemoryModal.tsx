/**
 * SaveMemoryModal — lightweight modal for saving a chat message as a memory.
 * Pre-fills content from the message; user can add title, tags, and select scope.
 * Shows success toast on save, prevents duplicate saves.
 */

import { useState, useCallback } from 'react'
import { Tag, Globe, Users, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/lib/theming'
import { useActionToast } from '@/hooks/useActionToast'
import { MemoryService } from '@/services/memory.service'
import type { MemoryScope, SaveMemoryParams } from '@/types/memories'

interface SaveMemoryModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-filled content from the chat message */
  messageContent: string
  /** Source message ID for duplicate prevention */
  sourceMessageId: string
  /** Callback after successful save (used to update isSaved state) */
  onSaved: (memoryId: string) => void
}

const SCOPE_OPTIONS: Array<{
  value: MemoryScope
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    value: 'personal',
    label: 'Personal',
    icon: User,
    description: 'Only you can see this memory',
  },
  {
    value: 'groups',
    label: 'Group',
    icon: Users,
    description: 'Shared with your group members',
  },
  {
    value: 'spaces',
    label: 'Space',
    icon: Globe,
    description: 'Visible in your spaces',
  },
]

export function SaveMemoryModal({
  isOpen,
  onClose,
  messageContent,
  sourceMessageId,
  onSaved,
}: SaveMemoryModalProps) {
  const t = useTheme()
  const { withToast } = useActionToast()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState(messageContent)
  const [tagsInput, setTagsInput] = useState('')
  const [scope, setScope] = useState<MemoryScope>('personal')
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when opening
  const handleOpen = useCallback(() => {
    setTitle('')
    setContent(messageContent)
    setTagsInput('')
    setScope('personal')
  }, [messageContent])

  // Parse comma-separated tags
  const parseTags = (input: string): string[] =>
    input
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSaving(true)
    try {
      const params: SaveMemoryParams = {
        content: content.trim(),
        title: title.trim() || null,
        tags: parseTags(tagsInput),
        scope,
        group_id: null, // TODO: group selector when scope === 'groups'
        source_message_id: sourceMessageId,
      }

      const result = await withToast(
        () => MemoryService.save(params),
        {
          success: { title: 'Memory saved', message: 'Your memory has been saved successfully.' },
          error: { title: 'Save failed', message: 'Could not save memory. Please try again.' },
        },
      )

      if (result) {
        onSaved(result.memory.id)
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title="Save as Memory"
      maxWidth="md"
      isLoading={isSaving}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="memory-title"
            className={`block text-sm font-medium ${t.textSecondary} mb-1`}
          >
            Title (optional)
          </label>
          <input
            id="memory-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this memory a title..."
            className={`w-full px-3 py-2 rounded-lg ${t.input} ${t.inputFocus} outline-none transition-colors`}
          />
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="memory-content"
            className={`block text-sm font-medium ${t.textSecondary} mb-1`}
          >
            Content
          </label>
          <textarea
            id="memory-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 rounded-lg resize-none ${t.input} ${t.inputFocus} outline-none transition-colors`}
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="memory-tags"
            className={`block text-sm font-medium ${t.textSecondary} mb-1`}
          >
            <Tag className="w-3.5 h-3.5 inline mr-1" />
            Tags (comma-separated)
          </label>
          <input
            id="memory-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., project, meeting, idea"
            className={`w-full px-3 py-2 rounded-lg ${t.input} ${t.inputFocus} outline-none transition-colors`}
          />
          {tagsInput && (
            <div className="flex flex-wrap gap-1 mt-2">
              {parseTags(tagsInput).map((tag) => (
                <span
                  key={tag}
                  className={`${t.badgeInfo} text-xs px-2 py-0.5 rounded-full`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scope Selector */}
        <div>
          <label className={`block text-sm font-medium ${t.textSecondary} mb-2`}>
            Scope
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SCOPE_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = scope === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScope(option.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : `${t.borderSubtle} ${t.hover}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
          <p className={`text-xs ${t.textMuted} mt-1`}>
            {SCOPE_OPTIONS.find((o) => o.value === scope)?.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`flex-1 px-4 py-2 rounded-lg border border-border-default ${t.textSecondary} hover:bg-bg-elevated transition-colors disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !content.trim()}
            className={`flex-1 px-4 py-2 rounded-lg ${t.buttonPrimary} transition-colors disabled:opacity-50`}
          >
            {isSaving ? 'Saving...' : 'Save Memory'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
