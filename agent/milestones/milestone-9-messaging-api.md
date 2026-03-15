# Milestone 9: Messaging API

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M6 (Wire remember-core), M7 (Memory Routes)
**Source**: Audit #3 — missing message API routes, conversation POST, quick fixes

---

## Goal

Create the message API routes that power DM and group chat, fix the conversation creation endpoint, and resolve quick bugs found in Audit #3.

## Deliverables

- `/api/conversations/$id/messages` routes (GET list, POST send, GET by ID, PATCH update, DELETE)
- Conversation POST handler in `/api/conversations`
- Fix upload auth bug (missing `await`)
- Add missing `initFirebaseAdmin()` to 6 routes

## Success Criteria

- [ ] Messages can be sent and received via API
- [ ] Message list returns paginated results
- [ ] Conversations can be created via POST
- [ ] Upload route has proper auth
- [ ] All API routes call `initFirebaseAdmin()`

## Tasks

- [Task 31: Message API Routes](../tasks/milestone-9-messaging-api/task-31-message-api-routes.md)
- [Task 32: Conversation POST + Quick Fixes](../tasks/milestone-9-messaging-api/task-32-conversation-post-quick-fixes.md)
