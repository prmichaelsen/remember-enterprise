# Task 32: Conversation POST + Quick Fixes

**Milestone**: [M9 - Messaging API](../../milestones/milestone-9-messaging-api.md)
**Design Reference**: None
**Estimated Time**: 1-2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Add conversation creation POST handler and fix quick bugs found in Audit #3.

---

## Steps

### 1. Add POST handler to `/api/conversations`
- Read existing `src/routes/api/conversations/index.tsx` — it only has GET
- Add POST handler: create conversation via ConversationDatabaseService
- Body: `{ type, participant_ids, name?, description? }`

### 2. Fix upload auth bug
- `src/routes/api/upload.tsx` line 26 — add missing `await` on `getServerSession()`

### 3. Add missing `initFirebaseAdmin()` calls
- Audit #3 identified 6 routes missing this call
- Search for routes that call `getServerSession` but don't call `initFirebaseAdmin()` first
- Add the call

---

## Verification

- [ ] POST `/api/conversations` creates a conversation
- [ ] Upload route properly awaits auth check
- [ ] All API routes call `initFirebaseAdmin()` before Firestore access
