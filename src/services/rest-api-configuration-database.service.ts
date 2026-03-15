import { queryDocuments } from '@prmichaelsen/firebase-admin-sdk-v8'
import type { QueryOptions } from '@prmichaelsen/firebase-admin-sdk-v8'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { z } from 'zod'

// Reuse agentbase.me's REST API config collection (shared Firestore)
const REST_API_CONFIGURATIONS = 'agentbase.rest-api-configurations'

const RestApiConfigurationSchema = z.object({
  id: z.string(),
  provider: z.string(),
  base_url: z.string().url(),
  service_token: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  created_at: z.string(),
  updated_at: z.string(),
})

export type RestApiConfiguration = z.infer<typeof RestApiConfigurationSchema>

/**
 * REST API Configuration Database Service
 *
 * Reads REST API endpoint configurations from Firestore.
 */
export class RestApiConfigurationDatabaseService {
  /**
   * Get active REST API configuration by provider name.
   */
  static async getByProvider(provider: string): Promise<RestApiConfiguration | null> {
    initFirebaseAdmin()

    const options: QueryOptions = {
      where: [
        { field: 'provider', op: '==', value: provider },
        { field: 'status', op: '==', value: 'active' },
      ],
    }

    const results = await queryDocuments(REST_API_CONFIGURATIONS, options)
    if (!results || results.length === 0) return null

    const doc = results[0]
    const data = { id: (doc as any).id, ...(doc as any).data }
    const parsed = RestApiConfigurationSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  }
}
