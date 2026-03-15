/**
 * Session management — delegates to @prmichaelsen/agentbase-core.
 * Cookie header helpers are remember-enterprise-specific (Set-Cookie formatting).
 */

export {
  getServerSession,
  isAuthenticated,
  createSessionCookie,
  revokeSession,
} from '@prmichaelsen/agentbase-core/lib/auth'

export function buildSessionCookieHeader(sessionCookie: string): string {
  return `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
}

export function buildClearSessionCookieHeader(): string {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
}
