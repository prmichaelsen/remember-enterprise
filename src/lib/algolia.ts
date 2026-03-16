/**
 * Algolia client factory — adapted from goodneighbor-core.
 * Uses env vars: ALGOLIA_APPLICATION_ID, ALGOLIA_ADMIN_API_KEY
 * Both admin and search clients use the admin key (server-side only).
 */

import { algoliasearch } from 'algoliasearch'

export const ALGOLIA_INDEX_NAME =
  process.env.ALGOLIA_INDEX_NAME ?? 'remember_enterprise'

let client: ReturnType<typeof algoliasearch> | null = null

function getClient() {
  if (client) return client
  const appId = process.env.ALGOLIA_APPLICATION_ID
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY
  if (!appId || !apiKey) {
    throw new Error('[algolia] ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY must be set')
  }
  client = algoliasearch(appId, apiKey)
  return client
}

export const getAlgoliaAdminClient = getClient
export const getAlgoliaSearchClient = getClient
