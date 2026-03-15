import {
  verifySessionCookie,
  verifyIdToken,
  createSessionCookie as createFirebaseSessionCookie,
} from '@prmichaelsen/firebase-admin-sdk-v8'

const COOKIE_NAME = '__session'
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 14 * 1000 // 14 days

function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const sessionCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))
  return sessionCookie ? sessionCookie.split('=').slice(1).join('=') : null
}

export async function getServerSession(request: Request) {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) return null

  let decodedToken
  try {
    decodedToken = await verifySessionCookie(sessionCookie)
  } catch {
    try {
      decodedToken = await verifyIdToken(sessionCookie)
    } catch {
      return null
    }
  }

  const isAnonymous =
    decodedToken.firebase?.sign_in_provider === 'anonymous' || !decodedToken.email

  return {
    uid: decodedToken.sub,
    email: decodedToken.email || null,
    displayName: decodedToken.name || null,
    photoURL: decodedToken.picture || null,
    emailVerified: decodedToken.email_verified || false,
    isAnonymous,
  }
}

export async function createSessionCookie(idToken: string): Promise<string> {
  return createFirebaseSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  })
}

export function buildSessionCookieHeader(sessionCookie: string, request?: Request): string {
  const parts = [
    `${COOKIE_NAME}=${sessionCookie}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_EXPIRY_MS / 1000}`,
    `Secure`,
  ]

  // Set Domain for custom domains so the cookie is sent correctly
  const host = request?.headers.get('host')
  if (host && !host.includes('workers.dev') && !host.includes('localhost')) {
    // For custom domains like memorycloud.chat, set Domain so cookie works
    const domain = host.split(':')[0] // strip port if present
    parts.push(`Domain=${domain}`)
  }

  return parts.join('; ')
}

export function buildClearSessionCookieHeader(request?: Request): string {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `Secure`,
  ]

  const host = request?.headers.get('host')
  if (host && !host.includes('workers.dev') && !host.includes('localhost')) {
    const domain = host.split(':')[0]
    parts.push(`Domain=${domain}`)
  }

  return parts.join('; ')
}
