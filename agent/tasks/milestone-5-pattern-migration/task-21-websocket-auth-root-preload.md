# Task 21: WebSocket Auth & Root Preload

**Milestone**: [M5 - Pattern Migration](../../milestones/milestone-5-pattern-migration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 1-2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Add authentication checks to WebSocket upgrade endpoints and implement root route auth session preloading.

---

## Steps

### 1. Add Auth to `/api/ws`
- Import `getServerSession` from `@/lib/auth/session`
- Verify session before WebSocket upgrade
- Reject with 401 if unauthenticated
- Pass `userId` and `userName` to Durable Object URL params

### 2. Add Auth to `/api/notifications-ws`
- Same auth check pattern
- Currently returns 501 — implement actual WebSocket upgrade with auth

### 3. Update Client WebSocket Manager
- Include session cookie in WebSocket connection (automatic for same-origin)
- Handle 401 response gracefully (don't retry auth failures)

---

## Verification

- [ ] `/api/ws` rejects unauthenticated upgrade requests with 401
- [ ] `/api/notifications-ws` rejects unauthenticated upgrade requests with 401
- [ ] Authenticated users can still connect to WebSocket
- [ ] Client handles 401 without infinite retry loop
