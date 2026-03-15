/**
 * Remember SDK Factory
 *
 * Creates SvcClient from @prmichaelsen/remember-core.
 * SvcClient: memory CRUD, spaces, relationships, search, feeds
 */

import { createSvcClient } from '@prmichaelsen/remember-core/clients/svc/v1'
import type { SvcClient } from '@prmichaelsen/remember-core/clients/svc/v1'
import { RestApiConfigurationDatabaseService } from '@/services/rest-api-configuration-database.service'

async function getAuthConfig() {
  const apiConfig = await RestApiConfigurationDatabaseService.getByProvider('remember')
  if (!apiConfig) throw new Error('Remember REST API configuration not found')

  const serviceToken = apiConfig.service_token
  if (!serviceToken) {
    throw new Error('Remember service token not found in REST API configuration')
  }

  return {
    baseUrl: apiConfig.base_url,
    auth: {
      serviceToken,
      jwtOptions: {
        issuer: 'remember-enterprise',
        audience: 'svc',
        expiresIn: '1h',
      },
    },
  }
}

let cachedSvcClient: SvcClient | null = null

export async function getRememberSvcClient(): Promise<SvcClient> {
  if (cachedSvcClient) return cachedSvcClient
  cachedSvcClient = createSvcClient(await getAuthConfig())
  return cachedSvcClient
}
