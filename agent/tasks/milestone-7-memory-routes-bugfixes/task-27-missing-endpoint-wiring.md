# Task 27: Missing Endpoint Wiring

**Milestone**: [M7 - Memory Routes & Bug Fixes](../../milestones/milestone-7-memory-routes-bugfixes.md)
**Design Reference**: [API Server Handlers Pattern](../../patterns/tanstack-cloudflare.api-server-handlers.md)
**Estimated Time**: 1 hour
**Dependencies**: Task 25
**Status**: Not Started

---

## Objective

Create remaining missing API routes that client services call but have no server-side handler.

---

## Routes to Create

### 1. `/api/memories/$memoryId/similar`
- GET: `MemoryDatabaseService.getSimilar(userId, memoryId, { limit })`
- Returns `{ memories: MemoryItem[] }`

### 2. `/api/ghosts/conversations/$conversationId/messages/stream`
- POST: streaming SSE endpoint for ghost AI responses
- Uses ChatEngine or direct LLM call with memory context
- Returns `text/event-stream`

### 3. `/api/users/search`
- GET: `?q=<query>` — search users by name/email
- Returns `{ users: [{ uid, displayName, email, photoURL }] }`
- Used by DM creation flow in chat.tsx

---

## Verification

- [ ] Similar memories endpoint returns results
- [ ] Ghost streaming endpoint streams responses (or returns stub with proper content-type)
- [ ] User search returns matching users
- [ ] DM creation flow in chat.tsx can find users

---

**Next Task**: None (M5 complete)
