# Task 26: Fix SSR Preload Bugs

**Milestone**: [M7 - Memory Routes & Bug Fixes](../../milestones/milestone-7-memory-routes-bugfixes.md)
**Design Reference**: [SSR Preload Pattern](../../patterns/tanstack-cloudflare.ssr-preload.md)
**Estimated Time**: 1 hour
**Dependencies**: None
**Status**: Not Started

---

## Objective

Fix wrong argument counts in SSR `beforeLoad` functions and fix notification API routes using client service instead of DatabaseService.

---

## Bugs to Fix

### 1. `src/routes/memories.tsx` (line ~19)
- **Bug**: `MemoryDatabaseService.getFeed(params)` — missing `userId` first arg
- **Fix**: `MemoryDatabaseService.getFeed(user.uid, params)`

### 2. `src/routes/ghost.tsx` (line ~22)
- **Bug**: `GhostDatabaseService.listGhosts()` — missing `userId` arg
- **Fix**: `GhostDatabaseService.listGhosts(user.uid)`

### 3. Notification API routes — wrong service layer
- `src/routes/api/notifications/index.tsx` imports client `notification.service.ts` — should use `NotificationDatabaseService`
- `src/routes/api/notifications/$id.read.tsx` same issue
- `src/routes/api/notifications/unread-count.tsx` same issue

---

## Verification

- [ ] Memories page SSR preloads data (check prod.log for non-null result)
- [ ] Ghost page SSR preloads ghost list
- [ ] Notification API routes return data without 500 errors
- [ ] Build passes

---

**Next Task**: [Task 27: Missing Endpoint Wiring](task-27-missing-endpoint-wiring.md)
