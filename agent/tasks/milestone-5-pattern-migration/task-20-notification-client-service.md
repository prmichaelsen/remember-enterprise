# Task 20: Extract NotificationClientService

**Milestone**: [M5 - Pattern Migration](../../milestones/milestone-5-pattern-migration.md)
**Design Reference**: [library-services pattern](../../patterns/tanstack-cloudflare.library-services.md)
**Estimated Time**: 1-2 hours
**Dependencies**: Task 18 (NotificationDatabaseService)
**Status**: Not Started

---

## Objective

Extract the inline `fetch()` calls from `AppShell` into a proper `NotificationClientService` wrapper, eliminating the library-services pattern violation.

---

## Steps

### 1. Create NotificationClientService
- `src/services/notification.service.ts` (client-side API wrapper)
- Methods: `fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`
- Each wraps `fetch('/api/notifications/...')` with error handling

### 2. Update AppShell
- Replace inline `fetch()` calls (lines 51-71) with `NotificationClientService` methods
- Pass service methods to `useNotifications` hook config

### 3. Verify
- Notification bell still works
- Mark as read still works
- No direct `fetch()` in AppShell

---

## Verification

- [ ] `NotificationClientService` created with all 5 methods
- [ ] `AppShell` imports and uses `NotificationClientService`
- [ ] No direct `fetch('/api/notifications...')` in components
- [ ] Notification UI unchanged (visual regression check)
