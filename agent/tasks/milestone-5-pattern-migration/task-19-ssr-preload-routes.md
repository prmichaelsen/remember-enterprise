# Task 19: Add SSR Preload to Routes

**Milestone**: [M5 - Pattern Migration](../../milestones/milestone-5-pattern-migration.md)
**Design Reference**: [ssr-preload pattern](../../patterns/tanstack-cloudflare.ssr-preload.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 18 (DatabaseServices must exist)
**Status**: Not Started

---

## Objective

Add `beforeLoad` SSR data preloading to all data-driven page routes, pass data through route context, and wire components to accept `initialData` props to skip client-side fetch.

---

## Steps

### 1. `/chat` Layout Route
- Add `beforeLoad`: call `ConversationDatabaseService.listConversations(userId)`
- Pass `initialConversations` through context
- Wire `ConversationSidebar`'s existing `initialConversations` prop

### 2. `/memories` Route
- Add `beforeLoad`: call `MemoryDatabaseService.getFeed(defaultParams)`
- Pass `initialMemories` through context
- Add `initialData` prop to `MemoryFeed` component
- Skip client fetch when SSR data present

### 3. `/ghost` Route
- Add `beforeLoad`: call `GhostDatabaseService.listGhosts()`
- Pass `initialGhosts` through context
- Add `initialData` prop to `GhostSelector`
- Skip client fetch when SSR data present

### 4. Fix `/chat/$conversationId`
- Replace client service imports in `beforeLoad` with `ConversationDatabaseService` and `MessageDatabaseService`
- Wire `getConversation` to actual DatabaseService call

### 5. Root Route Auth Preload
- Update `__root.tsx` `beforeLoad` to call `getAuthSession()` (the server function)
- Pass `initialUser` through context
- Update `AuthProvider` to accept and use SSR user

---

## Verification

- [ ] `/chat` preloads conversation list server-side
- [ ] `/memories` preloads memory feed server-side
- [ ] `/ghost` preloads ghost list server-side
- [ ] `/chat/$conversationId` uses DatabaseService in beforeLoad
- [ ] Root route preloads auth session
- [ ] No loading spinners on initial page load (data present from SSR)
- [ ] Components skip client fetch when SSR data exists
