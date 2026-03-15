import { initializeApp as _initializeApp } from '@prmichaelsen/firebase-admin-sdk-v8'

let initialized = false

export function initFirebaseAdmin() {
  if (initialized) return
  const serviceAccount = (globalThis as any).process?.env?.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    ?? (typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY : undefined)
  if (!serviceAccount) {
    console.warn('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY not set — session creation will fail')
    return
  }
  try {
    _initializeApp({
      serviceAccount,
      projectId: 'agentbase-prod',
    })
    initialized = true
  } catch (error: any) {
    console.error('firebase admin init failed', error.message)
  }
}

export function getFirebaseAdmin() {
  initFirebaseAdmin()
}
