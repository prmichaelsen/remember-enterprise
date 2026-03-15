/**
 * MemoryDatabaseService — server-side database layer for memories.
 *
 * TODO: This will eventually proxy to @prmichaelsen/remember-core SvcClient.
 * For now the class is structured with proper signatures but stubs the
 * underlying calls. When remember-core is integrated, replace the stubs
 * with SvcClient calls.
 */

import { initFirebaseAdmin } from '@/lib/firebase-admin'
import type {
  MemoryItem,
  MemoryFeedParams,
  SaveMemoryParams,
} from '@/types/memories'

export interface MemoryFeedResult {
  memories: MemoryItem[]
  total: number
  hasMore: boolean
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingMemoryId: string | null
}

export class MemoryDatabaseService {
  /**
   * Save a new memory.
   * TODO: Proxy to remember-core SvcClient.save()
   */
  static async save(params: SaveMemoryParams & { author_id: string; author_name: string }): Promise<MemoryItem> {
    initFirebaseAdmin()
    const now = new Date().toISOString()

    // TODO: Replace with remember-core SvcClient call
    const memory: MemoryItem = {
      id: crypto.randomUUID(),
      title: params.title ?? '',
      content: params.content,
      author_id: params.author_id,
      author_name: params.author_name,
      scope: params.scope,
      group_id: params.group_id,
      space_id: null,
      tags: params.tags,
      rating: null,
      significance: null,
      created_at: now,
      updated_at: now,
    }

    // TODO: Write to remember-core
    console.warn('[MemoryDatabaseService] save() is stubbed — remember-core not yet integrated')
    return memory
  }

  /**
   * Fetch a paginated memory feed for a user.
   * TODO: Proxy to remember-core SvcClient.getFeed()
   */
  static async getFeed(
    userId: string,
    params: MemoryFeedParams,
  ): Promise<MemoryFeedResult> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] getFeed() is stubbed — remember-core not yet integrated')
    void userId
    void params
    return { memories: [], total: 0, hasMore: false }
  }

  /**
   * Get a single memory by ID.
   * TODO: Proxy to remember-core SvcClient.getById()
   */
  static async getById(memoryId: string): Promise<MemoryItem | null> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] getById() is stubbed — remember-core not yet integrated')
    void memoryId
    return null
  }

  /**
   * Update an existing memory.
   * TODO: Proxy to remember-core SvcClient.update()
   */
  static async update(
    memoryId: string,
    updates: Partial<Pick<MemoryItem, 'title' | 'content' | 'tags' | 'rating'>>,
  ): Promise<MemoryItem | null> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] update() is stubbed — remember-core not yet integrated')
    void memoryId
    void updates
    return null
  }

  /**
   * Delete a memory.
   * TODO: Proxy to remember-core SvcClient.delete()
   */
  static async delete(memoryId: string): Promise<void> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] delete() is stubbed — remember-core not yet integrated')
    void memoryId
  }

  /**
   * Hybrid search — combines vector similarity + keyword search.
   * TODO: Proxy to remember-core SvcClient.search()
   */
  static async search(
    userId: string,
    query: string,
    limit: number = 20,
  ): Promise<MemoryItem[]> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] search() is stubbed — remember-core not yet integrated')
    void userId
    void query
    void limit
    return []
  }

  /**
   * Check if a message has already been saved as a memory (duplicate prevention).
   * TODO: Proxy to remember-core SvcClient.checkDuplicate()
   */
  static async checkDuplicate(sourceMessageId: string): Promise<DuplicateCheckResult> {
    initFirebaseAdmin()

    // TODO: Replace with remember-core SvcClient call
    console.warn('[MemoryDatabaseService] checkDuplicate() is stubbed — remember-core not yet integrated')
    void sourceMessageId
    return { isDuplicate: false, existingMemoryId: null }
  }
}
