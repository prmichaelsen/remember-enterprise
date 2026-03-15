/**
 * GroupCreateModal — form for creating a new group conversation.
 * Name, description, invite members by search.
 */

import { useState, useCallback } from 'react'
import { Users, X, Search, Plus } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/components/auth/AuthContext'
import { createGroup } from '@/services/group.service'

interface GroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (conversationId: string) => void
}

interface SearchUser {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
}

export function GroupCreateModal({
  isOpen,
  onClose,
  onGroupCreated,
}: GroupCreateModalProps) {
  const t = useTheme()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stub: user search — in production, calls a server function
  const searchUsers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        // Stub: server function for user search
        // const results = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        // setSearchResults(await results.json())

        // For development, return empty results
        setSearchResults([])
      } catch {
        // Search error
      } finally {
        setSearching(false)
      }
    },
    []
  )

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    searchUsers(query)
  }

  function addUser(searchUser: SearchUser) {
    if (selectedUsers.some((u) => u.uid === searchUser.uid)) return
    if (searchUser.uid === user?.uid) return // Cannot add self
    setSelectedUsers((prev) => [...prev, searchUser])
    setSearchQuery('')
    setSearchResults([])
  }

  function removeUser(uid: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.uid !== uid))
  }

  async function handleCreate() {
    if (!user) return
    if (!name.trim()) {
      setError('Group name is required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const result = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        invited_user_ids: selectedUsers.map((u) => u.uid),
      })

      onGroupCreated(result.conversation.id)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  function handleClose() {
    setName('')
    setDescription('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedUsers([])
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group" isLoading={creating}>
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className={`px-3 py-2 rounded-lg text-sm ${t.badgeDanger}`}>
            {error}
          </div>
        )}

        {/* Group name */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${t.textSecondary}`}>
            Group Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Project Alpha"
            className={`w-full px-3 py-2 rounded-lg text-sm ${t.input} ${t.inputFocus} outline-none`}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${t.textSecondary}`}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group about?"
            rows={2}
            className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${t.input} ${t.inputFocus} outline-none`}
            maxLength={500}
          />
        </div>

        {/* Invite members */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${t.textSecondary}`}>
            Invite Members
          </label>

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedUsers.map((su) => (
                <span
                  key={su.uid}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${t.badgeDefault}`}
                >
                  {su.displayName || su.email}
                  <button
                    type="button"
                    onClick={() => removeUser(su.uid)}
                    className="p-0.5 rounded-full hover:bg-black/10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${t.input} ${t.inputFocus} outline-none`}
            />
          </div>

          {/* Search results dropdown */}
          {(searchResults.length > 0 || searching) && (
            <div className={`mt-1 rounded-lg overflow-hidden ${t.card}`}>
              {searching ? (
                <div className={`px-3 py-2 text-sm ${t.textMuted}`}>Searching...</div>
              ) : (
                searchResults.map((result) => {
                  const isSelected = selectedUsers.some((u) => u.uid === result.uid)
                  return (
                    <button
                      key={result.uid}
                      type="button"
                      onClick={() => addUser(result)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left ${t.hover} transition-colors disabled:opacity-50`}
                    >
                      {result.photoURL ? (
                        <img
                          src={result.photoURL}
                          alt={result.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${t.elevated}`}
                        >
                          <span className={`text-xs font-medium ${t.textSecondary}`}>
                            {(result.displayName || result.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${t.textPrimary}`}>
                          {result.displayName}
                        </p>
                        <p className={`text-xs truncate ${t.textMuted}`}>
                          {result.email}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className={`text-xs ${t.textMuted}`}>Added</span>
                      ) : (
                        <Plus className={`w-4 h-4 ${t.textMuted}`} />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className={`flex-1 px-4 py-2 rounded-lg text-sm ${t.buttonGhost} ${t.border} disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${t.buttonPrimary} disabled:opacity-50`}
          >
            <Users className="w-4 h-4" />
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
