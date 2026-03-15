/**
 * FCM (Firebase Cloud Messaging) client-side integration.
 *
 * Handles:
 * - Service worker registration for background push
 * - Permission request flow (with graceful denial handling)
 * - FCM token retrieval and storage
 * - Token refresh lifecycle
 */

import { initializeFirebase, getFirebaseApp } from '@/lib/firebase-client'

// FCM token storage key in localStorage
const FCM_TOKEN_KEY = 'remember_fcm_token'
const FCM_PERMISSION_KEY = 'remember_fcm_permission'

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

// ---------------------------------------------------------------------------
// Service Worker Registration
// ---------------------------------------------------------------------------

let swRegistration: ServiceWorkerRegistration | null = null

export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null

  try {
    swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' },
    )

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready

    return swRegistration
  } catch (error) {
    console.error('[FCM] Service worker registration failed:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Permission Request Flow
// ---------------------------------------------------------------------------

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  if (!('serviceWorker' in navigator)) return 'unsupported'

  return Notification.permission as PushPermissionState
}

export function hasUserRespondedToPrompt(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(FCM_PERMISSION_KEY) !== null
}

export function markPromptResponded(state: PushPermissionState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(FCM_PERMISSION_KEY, state)
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'

  try {
    const result = await Notification.requestPermission()
    const state = result as PushPermissionState
    markPromptResponded(state)
    return state
  } catch {
    markPromptResponded('denied')
    return 'denied'
  }
}

// ---------------------------------------------------------------------------
// FCM Token Management
// ---------------------------------------------------------------------------

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const permission = getPushPermissionState()
  if (permission !== 'granted') return null

  try {
    initializeFirebase()

    // Dynamic import to avoid bundling firebase/messaging when not needed
    const { getMessaging, getToken } = await import('firebase/messaging')

    const app = getFirebaseApp()
    const messaging = getMessaging(app)

    if (!swRegistration) {
      swRegistration = await registerFCMServiceWorker()
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '',
      serviceWorkerRegistration: swRegistration ?? undefined,
    })

    if (token) {
      // Store locally for quick access
      localStorage.setItem(FCM_TOKEN_KEY, token)
      // Register token with server
      await registerTokenWithServer(token)
    }

    return token
  } catch (error) {
    console.error('[FCM] Failed to get token:', error)
    return null
  }
}

export function getCachedFCMToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(FCM_TOKEN_KEY)
}

export function clearFCMToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(FCM_TOKEN_KEY)
}

// ---------------------------------------------------------------------------
// Token Registration with Server
// ---------------------------------------------------------------------------

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    // Non-critical — token will be re-registered on next app load
  }
}

export async function unregisterTokenFromServer(): Promise<void> {
  const token = getCachedFCMToken()
  if (!token) return

  try {
    await fetch('/api/push/unregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    // Best effort
  }

  clearFCMToken()
}

// ---------------------------------------------------------------------------
// Token Refresh Listener
// ---------------------------------------------------------------------------

export async function setupTokenRefreshListener(): Promise<() => void> {
  if (typeof window === 'undefined') return () => {}

  try {
    initializeFirebase()
    const { getMessaging, onMessage } = await import('firebase/messaging')

    const app = getFirebaseApp()
    const messaging = getMessaging(app)

    // onMessage handles foreground messages — display as in-app notification
    const unsubscribe = onMessage(messaging, (payload) => {
      // Dispatch a custom event that the notification system can pick up
      const event = new CustomEvent('fcm:foreground-message', {
        detail: payload,
      })
      window.dispatchEvent(event)
    })

    return unsubscribe
  } catch {
    return () => {}
  }
}

// ---------------------------------------------------------------------------
// Deep Link Handler
// ---------------------------------------------------------------------------

/**
 * Handle notification click deep linking.
 * Called from the service worker's notificationclick event.
 */
export function buildDeepLink(data: Record<string, string>): string {
  const conversationId = data.conversation_id
  if (conversationId) {
    return `/chat/${conversationId}`
  }
  return '/'
}

// ---------------------------------------------------------------------------
// Initialize FCM (call once on app startup)
// ---------------------------------------------------------------------------

export async function initializeFCM(): Promise<void> {
  const permission = getPushPermissionState()
  if (permission !== 'granted') return

  await registerFCMServiceWorker()
  await getFCMToken()
  await setupTokenRefreshListener()
}
