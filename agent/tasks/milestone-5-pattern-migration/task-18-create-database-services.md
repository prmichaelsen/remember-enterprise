# Task 18: Create Missing DatabaseServices

**Milestone**: [M5 - Pattern Migration](../../milestones/milestone-5-pattern-migration.md)
**Design Reference**: [library-services pattern](../../patterns/tanstack-cloudflare.library-services.md)
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create proper server-side DatabaseService classes for all domains that currently lack them, and split existing ambiguous services into clean server/client pairs following the library-services pattern.

---

## Steps

### 1. Create MessageDatabaseService
- `src/services/message-database.service.ts`
- Methods: `listMessages`, `sendMessage`, `getMessage`, `updateMessage`, `deleteMessage`, `markConversationRead`
- Uses `@prmichaelsen/firebase-admin-sdk-v8` for Firestore access
- Used by: API routes, `beforeLoad` in `$conversationId.tsx`

### 2. Create NotificationDatabaseService
- `src/services/notification-database.service.ts`
- Methods: `create`, `listByUser`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `delete`
- Replace current in-memory store in `notification.service.ts`
- Used by: `/api/notifications/*` routes, `notification-triggers.ts`

### 3. Create GroupDatabaseService
- `src/services/group-database.service.ts`
- Methods: `createGroup`, `getGroup`, `listMembers`, `addMember`, `removeMember`, `updateGroup`, `checkPermission`
- Extract stub Firestore + ACL logic from current `group.service.ts`
- Used by: API routes

### 4. Create MemoryDatabaseService
- `src/services/memory-database.service.ts`
- Methods: `save`, `getFeed`, `getById`, `update`, `delete`, `search`, `checkDuplicate`
- Proxy to `@prmichaelsen/remember-core` SvcClient
- Used by: `/api/memories/*` routes

### 5. Create GhostDatabaseService
- `src/services/ghost-database.service.ts`
- Methods: `listGhosts`, `getOrCreateConversation`, `sendMessage`, `listConversations`
- Used by: `/api/ghost/*` routes

### 6. Clean Up Client Services
- Strip stub Firestore code from `message.service.ts`, `group.service.ts`
- Ensure client services ONLY call `fetch('/api/...')` endpoints
- Rename `notification.service.ts` → keep as `notification-database.service.ts`

---

## Verification

- [ ] 5 new DatabaseService files created
- [ ] Each DatabaseService uses firebase-admin-sdk-v8 or remember-core
- [ ] Client services (`*.service.ts`) contain only `fetch()` wrappers
- [ ] No stub Firestore code in client services
- [ ] API routes import DatabaseService, not client Service
- [ ] `beforeLoad` imports DatabaseService, not client Service
