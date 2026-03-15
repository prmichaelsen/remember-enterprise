/**
 * Firebase Admin SDK — server-side only
 * Uses @prmichaelsen/firebase-admin-sdk-v8 (not canonical firebase-admin)
 * TODO: Task 4 — configure with service account credentials
 */

export function initFirebaseAdmin() {
  // Placeholder — will initialize firebase-admin-sdk-v8 with service account
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string }> {
  // Placeholder — will use firebase-admin-sdk-v8 verifyIdToken
  throw new Error('Firebase Admin not configured yet')
}
