# Task 4: Firebase Auth Integration

**Milestone**: [M1 - Project Scaffolding](../../milestones/milestone-1-project-scaffolding.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 2
**Status**: Not Started

---

## Objective

Integrate Firebase Auth shared with agentbase.me — cookie-based sessions, AuthProvider context, SSR + client sync, and protected route middleware.

---

## Steps

### 1. Configure Firebase Client SDK
- Install `firebase` package
- Create `src/lib/firebase-client.ts` with shared Firebase config (same project as agentbase.me)
- Initialize Firebase Auth

### 2. Configure Firebase Admin SDK
- Install `firebase-admin`
- Create server-side session validation using Firebase Admin
- Cookie-based session management (HTTP-only cookies)

### 3. Create AuthProvider Context
- `src/lib/auth.tsx` with AuthContext
- Expose `{ user, loading }` state
- SSR: `getAuthSession()` in `beforeLoad()` passes `initialUser`
- Client: Firebase `onAuthChange()` syncs state

### 4. Create Auth Routes
- `/api/auth/login` — validate idToken, set session cookie
- `/api/auth/logout` — clear session cookie
- `/auth` — login page with Firebase sign-in UI

### 5. Protected Route Middleware
- `beforeLoad()` guard that redirects unauthenticated users to `/auth`
- `isRealUser(user)` check (not anonymous)
- `redirect_url` param for post-login redirect

---

## Verification

- [ ] User can sign in and session cookie is set
- [ ] User can sign out and cookie is cleared
- [ ] Protected routes redirect to `/auth` when unauthenticated
- [ ] SSR renders correct auth state (no hydration mismatch)
- [ ] Shared auth works — login on agentbase.me is recognized here

---

**Next Task**: [Task 5: WebSocket Durable Objects](task-5-websocket-durable-objects.md)
**Related Design Docs**: [Requirements](../../design/local.requirements.md)
