/**
 * Server function for SSR auth session preloading.
 * Used in beforeLoad per SSR preload pattern.
 */

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@prmichaelsen/agentbase-core/lib/auth'
import type { AuthUser } from '@prmichaelsen/agentbase-core/types'

export const getAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    initFirebaseAdmin()
    const request = getRequest()
    if (!request) return null
    const session = await getServerSession(request)
    return session?.user ?? null
  },
)
