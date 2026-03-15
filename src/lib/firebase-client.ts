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

export async function resetPassword(email: string) {
  initializeFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  return sendPasswordResetEmail(auth, email)
}

export { app, auth }
