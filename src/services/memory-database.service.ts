/**
 * MemoryDatabaseService — server-side database layer for memories.
 *
 * Proxies to @prmichaelsen/remember-core SvcClient for all CRUD, feed,
 * and search operations.
 */

import { getRememberSvcClient } from '@/lib/remember-sdk'
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
   * Save a new memory via SvcClient.
   */
  static async save(params: SaveMemoryParams & { author_id: string; author_name: string }): Promise<MemoryItem> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    const res = await svc.memories.create(params.author_id, {
      content: params.content,
      title: params.title ?? '',
      tags: params.tags,
    })
    const data = res.throwOnError() as any

    // Map SvcClient response to MemoryItem shape
    return {
      id: data.id ?? data.memory?.id ?? crypto.randomUUID(),
      title: data.title ?? data.memory?.title ?? params.title ?? '',
      content: data.content ?? data.memory?.content ?? params.content,
      author_id: params.author_id,
      author_name: params.author_name,
      scope: params.scope,
      group_id: params.group_id,
      space_id: null,
      tags: data.tags ?? data.memory?.tags ?? params.tags,
      rating: data.rating ?? data.memory?.rating ?? null,
      significance: data.significance ?? data.memory?.significance ?? null,
      created_at: data.created_at ?? data.memory?.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? data.memory?.updated_at ?? new Date().toISOString(),
    }
  }

  /**
   * Fetch a paginated memory feed for a user.
   * Maps algorithm names to the appropriate SvcClient method.
   */
  static async getFeed(
    userId: string,
    params: MemoryFeedParams,
  ): Promise<MemoryFeedResult> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    const { algorithm, limit, offset } = params
    const query = params.query ?? '*'

    let res: any

    switch (algorithm) {
      case 'smart':
        res = await svc.memories.byRecommendation(userId, { query, limit, offset })
        break
      case 'chronological':
        res = await svc.memories.byTime(userId, { query, limit, offset, direction: 'desc' })
        break
      case 'discovery':
        res = await svc.memories.byDiscovery(userId, { query, limit, offset })
        break
      case 'rating':
        res = await svc.memories.byRating(userId, { query, limit, offset })
        break
      case 'significance':
        res = await svc.memories.byDensity(userId, { query, limit, offset })
        break
      default:
        res = await svc.memories.byRecommendation(userId, { query, limit, offset })
        break
    }

    const data = res.throwOnError() as any
    const memories = (data.memories ?? []) as MemoryItem[]
    const total = data.total ?? memories.length

    return {
      memories,
      total,
      hasMore: memories.length === limit,
    }
  }

  /**
   * Get a single memory by ID.
   */
  static async getById(userId: string, memoryId: string): Promise<MemoryItem | null> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    try {
      const res = await svc.memories.get(userId, memoryId, {})
      const data = res.throwOnError() as any
      return (data.memory ?? data) as MemoryItem
    } catch {
      return null
    }
  }

  /**
   * Update an existing memory.
   */
  static async update(
    userId: string,
    memoryId: string,
    updates: Partial<Pick<MemoryItem, 'title' | 'content' | 'tags' | 'rating'>>,
  ): Promise<MemoryItem | null> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    try {
      const res = await svc.memories.update(userId, memoryId, updates)
      const data = res.throwOnError() as any
      return (data.memory ?? data) as MemoryItem
    } catch {
      return null
    }
  }

  /**
   * Delete a memory.
   */
  static async delete(userId: string, memoryId: string): Promise<void> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    const res = await svc.memories.delete(userId, memoryId, {})
    res.throwOnError()
  }

  /**
   * Hybrid search — combines vector similarity + keyword search.
   */
  static async search(
    userId: string,
    query: string,
    limit: number = 20,
  ): Promise<MemoryItem[]> {
    initFirebaseAdmin()
    const svc = await getRememberSvcClient()

    const res = await svc.memories.search(userId, { query, limit, offset: 0 })
    const data = res.throwOnError() as any
    return (data.memories ?? []) as MemoryItem[]
  }

  /**
   * Check if a message has already been saved as a memory (duplicate prevention).
   */
  static async checkDuplicate(sourceMessageId: string): Promise<DuplicateCheckResult> {
    initFirebaseAdmin()

    // Duplicate check is not directly supported by SvcClient —
    // this would require a custom query. For now, return not duplicate.
    void sourceMessageId
    return { isDuplicate: false, existingMemoryId: null }
  }
}
