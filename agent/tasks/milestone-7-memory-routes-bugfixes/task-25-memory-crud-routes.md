# Task 25: Memory CRUD API Routes

**Milestone**: [M7 - Memory Routes & Bug Fixes](../../milestones/milestone-7-memory-routes-bugfixes.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create the missing memory API routes that the client-side `memory.service.ts` calls. All routes delegate to `MemoryDatabaseService` which proxies to remember-core SvcClient. Follow `createFileRoute` + `server.handlers` pattern.

---

## Context

Audit #2 found these client service methods call routes that don't exist:
- `getById()` → `GET /api/memories/$memoryId` (missing)
- `update()` → `PATCH /api/memories/$memoryId` (missing)
- `delete()` → `DELETE /api/memories/$memoryId` (missing)
- `checkDuplicate()` → `POST /api/memories/check-duplicate` (missing)

agentbase.me pattern: routes call `svc.memories.get()`, `.update()`, `.delete()` via SvcClient.

---

## Steps

### 1. Create `/api/memories/$memoryId` route
- GET: `MemoryDatabaseService.getById(userId, memoryId)` → return memory with optional relationships/similar
- PATCH: `MemoryDatabaseService.update(userId, memoryId, body)` → return updated memory
- DELETE: `MemoryDatabaseService.delete(userId, memoryId)` → return `{ deleted: true }`
- Auth guard via `getServerSession`

### 2. Create `/api/memories/check-duplicate` route
- POST body: `{ content: string, conversation_id?: string }`
- `MemoryDatabaseService.checkDuplicate(userId, content)` → return `{ isDuplicate, existingMemoryId? }`

### 3. Create `/api/memories/$memoryId/rate` route
- GET: get user's rating for memory
- POST body: `{ rating: 1-5 }` → set rating
- DELETE: remove rating

---

## Verification

- [ ] `GET /api/memories/$memoryId` returns memory data
- [ ] `PATCH /api/memories/$memoryId` updates memory
- [ ] `DELETE /api/memories/$memoryId` soft-deletes memory
- [ ] `POST /api/memories/check-duplicate` returns duplicate check result
- [ ] Rate endpoints work (GET/POST/DELETE)
- [ ] All routes use `createFileRoute` + `server.handlers` pattern
- [ ] All routes auth-gated

---

**Next Task**: [Task 26: Fix SSR Preload Bugs](task-26-fix-ssr-preload-bugs.md)
