/**
 * Server function for SSR auth session preloading
 * Used in beforeLoad per SSR preload pattern
 * TODO: Task 4 — implement with real session verification
 */

import { createServerFn } from '@tanstack/react-start'

export const getAuthSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Placeholder — will verify session cookie and return user
    return null
  },
)
