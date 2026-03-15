/**
 * Firebase Client — delegates to @prmichaelsen/agentbase-core.
 * This module handles env-specific config and re-exports all auth helpers.
 */

import {
  initializeFirebase as coreInitializeFirebase,
  getFirebaseApp,
  getFirebaseAuth,
  signIn,
  signUp,
  signInAnonymously,
  upgradeAnonymousAccount,
  upgradeAnonymousWithPopup,
  resetPassword,
  logout,
  onAuthChange,
  getCurrentUser,
  getIdToken,
} from '@prmichaelsen/agentbase-core/lib'
export type { User, UserCredential, Auth } from '@prmichaelsen/agentbase-core/lib'

export function initializeFirebase() {
  if (typeof window === 'undefined') return
  coreInitializeFirebase({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  })
}

export {
  getFirebaseApp,
  getFirebaseAuth,
  signIn,
  signUp,
  signInAnonymously,
  upgradeAnonymousAccount,
  upgradeAnonymousWithPopup,
  resetPassword,
  logout,
  onAuthChange,
  getCurrentUser,
  getIdToken,
}
