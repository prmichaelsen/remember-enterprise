/**
 * Firebase Client SDK initialization
 * Shared Firebase project with agentbase.me
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type Auth,
  type User,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
}

let app: FirebaseApp | undefined
let auth: Auth | undefined

export function initializeFirebase() {
  if (typeof window === 'undefined') return
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  initializeFirebase()
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export async function getIdToken(): Promise<string | null> {
  initializeFirebase()
  if (!auth?.currentUser) return null
  return auth.currentUser.getIdToken()
}

export async function signIn(email: string, password: string) {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUp(email: string, password: string) {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function signInAnon() {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return signInAnonymously(auth)
}

/**
 * Link an anonymous account with email/password credentials.
 * Preserves the anonymous UID so all existing data stays associated.
 */
export async function linkAnonymousAccount(email: string, password: string) {
  initializeFirebase()
  if (!auth?.currentUser) throw new Error('No current user')
  if (!auth.currentUser.isAnonymous) throw new Error('Current user is not anonymous')
  const credential = EmailAuthProvider.credential(email, password)
  return linkWithCredential(auth.currentUser, credential)
}

export async function signOut() {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return firebaseSignOut(auth)
}

export async function resetPassword(email: string) {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return sendPasswordResetEmail(auth, email)
}

export { app, auth }
