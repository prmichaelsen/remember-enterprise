# Milestone 5: Pattern Migration

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M1-M4 (all complete)
**Source**: Audit #1 — Library Services & SSR Preload Pattern Compliance

---

## Goal

Migrate all routes, services, and components to follow the established `library-services` and `ssr-preload` patterns from the `tanstack-cloudflare` package. Eliminate server/client boundary violations, add SSR data preloading to all data-driven routes, and close auth gaps on WebSocket endpoints.

## Deliverables

- DatabaseService classes for all domains (message, notification, group, memory, ghost)
- `beforeLoad` SSR preloading on `/chat`, `/memories`, `/ghost` routes
- Clean server/client service separation (no stub Firestore in client services)
- NotificationClientService extracted from AppShell
- Auth on WebSocket endpoints
- Root route `getAuthSession` preload

## Success Criteria

- [ ] Every page route with data uses `beforeLoad` + route context
- [ ] Every domain has separate DatabaseService (server) and Service (client) files
- [ ] No direct `fetch()` calls in components — all go through Service wrappers
- [ ] No client-side service imports in `beforeLoad` — all use DatabaseService
- [ ] WebSocket endpoints verify session before upgrade
- [ ] Root route preloads auth session server-side

## Tasks

- [Task 18: Create Missing DatabaseServices](../tasks/milestone-5-pattern-migration/task-18-create-database-services.md)
- [Task 19: Add SSR Preload to Routes](../tasks/milestone-5-pattern-migration/task-19-ssr-preload-routes.md)
- [Task 20: Extract NotificationClientService](../tasks/milestone-5-pattern-migration/task-20-notification-client-service.md)
- [Task 21: WebSocket Auth & Root Preload](../tasks/milestone-5-pattern-migration/task-21-websocket-auth-root-preload.md)
