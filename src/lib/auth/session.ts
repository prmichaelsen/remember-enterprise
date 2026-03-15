/**
 * Session management — cookie-based auth
 * TODO: Task 4 — implement with Firebase Admin SDK
 */

export function createSessionCookie(idToken: string): string {
  // Placeholder — will create encrypted session cookie
  return ''
}

export function buildSessionCookieHeader(sessionCookie: string): string {
  return `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
}

export function buildClearSessionCookieHeader(): string {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
}

export function getServerSession(request: Request): { uid: string } | null {
  // Placeholder — will extract and verify session cookie
  const cookie = request.headers.get('Cookie')
  if (!cookie) return null
  return null
}

export function verifySessionCookie(cookie: string): { uid: string } | null {
  // Placeholder
  return null
}

export function clearSessionCookie(): string {
  return buildClearSessionCookieHeader()
}
