/**
 * Memory types — consumed via @prmichaelsen/remember-core.
 * These mirror the remember-core SDK types for use in UI components.
 */

export type MemoryScope = 'personal' | 'groups' | 'spaces' | 'friends'

export type MemoryFeedAlgorithm =
  | 'smart'
  | 'chronological'
  | 'discovery'
  | 'rating'
  | 'significance'

export interface MemoryItem {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  scope: MemoryScope
  group_id: string | null
  space_id: string | null
  tags: string[]
  rating: number | null // 1-5
  significance: number | null // 0-1
  created_at: string
  updated_at: string
}

export interface MemoryFeedParams {
  algorithm: MemoryFeedAlgorithm
  scope: MemoryScope | 'all'
  query: string | null
  limit: number
  offset: number
}

export interface SaveMemoryParams {
  content: string
  title: string | null
  tags: string[]
  scope: MemoryScope
  group_id: string | null
  source_message_id: string | null
}
