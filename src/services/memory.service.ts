/**
 * Memory CRUD service — wraps remember-core SvcClient for memory operations.
 * Accepts TS errors for missing remember-core SDK; resolved when dependency lands.
 */

import type {
  MemoryItem,
  MemoryFeedParams,
  SaveMemoryParams,
} from '@/types/memories'

/** Response shape from paginated memory feed endpoints */
export interface MemoryFeedResponse {
  memories: MemoryItem[]
  total: number
  hasMore: boolean
  limit: number
  offset: number
}

/** Response shape for a single memory operation */
export interface MemorySaveResponse {
  memory: MemoryItem
}

/** Duplicate check result */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingMemoryId: string | null
}

/**
 * MemoryService — all memory CRUD, feed, and search operations.
 *
 * Each method calls the server API which proxies to remember-core SvcClient.
 * The server endpoint handles auth, rate limiting, and scope enforcement.
 */
export const MemoryService = {
  /**
   * Save a new memory (from chat message or manual entry).
   */
  async save(params: SaveMemoryParams): Promise<MemorySaveResponse> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as any
      throw new Error(body.error ?? `Failed to save memory (${res.status})`)
    }
    return res.json()
  },

  /**
   * Fetch a paginated memory feed with algorithm, scope, and query filtering.
   */
  async getFeed(params: MemoryFeedParams): Promise<MemoryFeedResponse> {
    try {
      const qs = new URLSearchParams({
        algorithm: params.algorithm,
        scope: params.scope,
        limit: String(params.limit),
        offset: String(params.offset),
        ...(params.query ? { query: params.query } : {}),
      })
      const res = await fetch(`/api/memories/feed?${qs}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[MemoryService] getFeed failed:', res.status, body)
        return { memories: [], total: 0, hasMore: false, limit: params.limit, offset: params.offset }
      }
      return res.json()
    } catch (err) {
      console.error('[MemoryService] getFeed error:', err)
      return { memories: [], total: 0, hasMore: false, limit: params.limit, offset: params.offset }
    }
  },

  /**
   * Get a single memory by ID.
   */
  async getById(memoryId: string): Promise<MemoryItem> {
    const res = await fetch(`/api/memories/${memoryId}`)
    if (!res.ok) {
      throw new Error(`Memory not found (${res.status})`)
    }
    return res.json()
  },

  /**
   * Update an existing memory.
   */
  async update(
    memoryId: string,
    updates: Partial<Pick<MemoryItem, 'title' | 'content' | 'tags' | 'rating'>>,
  ): Promise<MemoryItem> {
    const res = await fetch(`/api/memories/${memoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      throw new Error(`Failed to update memory (${res.status})`)
    }
    return res.json()
  },

  /**
   * Delete a memory.
   */
  async delete(memoryId: string): Promise<void> {
    const res = await fetch(`/api/memories/${memoryId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`Failed to delete memory (${res.status})`)
    }
  },

  /**
   * Hybrid search — combines vector similarity + keyword search.
   */
  async search(query: string, limit = 20): Promise<MemoryFeedResponse> {
    try {
      const qs = new URLSearchParams({ query, limit: String(limit) })
      const res = await fetch(`/api/memories/search?${qs}`)
      if (!res.ok) {
        return { memories: [], total: 0, hasMore: false, limit, offset: 0 }
      }
      return res.json()
    } catch {
      return { memories: [], total: 0, hasMore: false, limit, offset: 0 }
    }
  },

  /**
   * Check if a message has already been saved as a memory (duplicate prevention).
   */
  async checkDuplicate(sourceMessageId: string): Promise<DuplicateCheckResult> {
    const res = await fetch(
      `/api/memories/check-duplicate?source_message_id=${encodeURIComponent(sourceMessageId)}`,
    )
    if (!res.ok) {
      return { isDuplicate: false, existingMemoryId: null }
    }
    return res.json()
  },
}
