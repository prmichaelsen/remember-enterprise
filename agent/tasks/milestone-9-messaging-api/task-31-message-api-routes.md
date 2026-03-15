# Task 31: Message API Routes

**Milestone**: [M9 - Messaging API](../../milestones/milestone-9-messaging-api.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create API routes for message CRUD that the client-side `message.service.ts` calls, wired to `MessageDatabaseService`.

---

## Steps

### 1. Create `/api/conversations/$conversationId/messages` routes

Check `src/services/message.service.ts` for the exact fetch URLs, then create matching routes:

- **GET** `/api/conversations/$conversationId/messages` — list messages (query params: limit, cursor)
  - Call `MessageDatabaseService.listMessages(conversationId, limit, cursor)`
- **POST** `/api/conversations/$conversationId/messages` — send message
  - Body: `{ content, role?, attachments? }`
  - Call `MessageDatabaseService.sendMessage(conversationId, { sender_id: session.uid, content, ... })`
- **GET** `/api/conversations/$conversationId/messages/$messageId` — get single message
  - Call `MessageDatabaseService.getMessage(conversationId, messageId)`
- **PATCH** `/api/conversations/$conversationId/messages/$messageId` — update message
  - Call `MessageDatabaseService.updateMessage(conversationId, messageId, updates)`
- **DELETE** `/api/conversations/$conversationId/messages/$messageId` — delete message
  - Call `MessageDatabaseService.deleteMessage(conversationId, messageId)`

### 2. Add mark-as-read endpoint

- **POST** `/api/conversations/$conversationId/messages/read` — mark conversation read
  - Call `MessageDatabaseService.markConversationRead(conversationId, session.uid)`

All routes: `createFileRoute` + `server.handlers`, auth via `getServerSession`, `initFirebaseAdmin()`.

---

## Verification

- [ ] All 6 message endpoints exist and return correct responses
- [ ] Auth check on all routes
- [ ] Client service fetch URLs match route paths
- [ ] Messages persist to Firestore via MessageDatabaseService
