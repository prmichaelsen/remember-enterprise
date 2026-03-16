/**
 * Algolia client — queries existing agentbase.me indices (read-only).
 * Uses env vars: ALGOLIA_APPLICATION_ID, ALGOLIA_ADMIN_API_KEY
 */

import { algoliasearch } from 'algoliasearch'

// Indices populated by agentbase.me
export const MESSAGES_INDEX = 'agentbase_messages'
export const USERS_INDEX = 'agentbase_users'
export const CONVERSATIONS_INDEX = 'agentbase_conversations'
export const GROUPS_INDEX = 'agentbase_groups'

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

export const getAlgoliaClient = getClient
