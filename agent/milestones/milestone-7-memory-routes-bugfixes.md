# Milestone 7: Memory Routes & Bug Fixes

**Goal**: Wire missing memory API routes through SvcClient and fix SSR preload / notification service layer bugs identified in audit-2
**Duration**: 1 week
**Dependencies**: M3 (Memory Integration)
**Status**: Not Started

---

## Overview

Audit #2 identified ~20% of code that would fail at runtime due to missing API routes, wrong argument counts in SSR preloads, and notification API routes using the wrong service layer. This milestone closes those gaps.

---

## Deliverables

### 1. Memory CRUD Routes
- GET/PATCH/DELETE `/api/memories/$memoryId`
- POST `/api/memories/check-duplicate`
- GET/POST/DELETE `/api/memories/$memoryId/rate`

### 2. SSR Preload Fixes
- `memories.tsx` and `ghost.tsx` beforeLoad arg fixes
- Notification API routes rewired to DatabaseService

### 3. Missing Endpoint Wiring
- `/api/memories/$memoryId/similar`
- `/api/ghosts/conversations/$id/messages/stream`
- `/api/users/search`

---

## Success Criteria

- [ ] All memory client service methods have corresponding server routes
- [ ] SSR preloads in memories.tsx and ghost.tsx return data (not silently failing)
- [ ] Notification API routes use NotificationDatabaseService (not client service)
- [ ] Build passes
- [ ] No 404s or 500s for memory/notification endpoints in prod.log

---

## Tasks

1. [Task 25: Memory CRUD API Routes](../tasks/milestone-7-memory-routes-bugfixes/task-25-memory-crud-routes.md)
2. [Task 26: Fix SSR Preload Bugs](../tasks/milestone-7-memory-routes-bugfixes/task-26-fix-ssr-preload-bugs.md)
3. [Task 27: Missing Endpoint Wiring](../tasks/milestone-7-memory-routes-bugfixes/task-27-missing-endpoint-wiring.md)

---

**Next Milestone**: TBD
**Blockers**: None
