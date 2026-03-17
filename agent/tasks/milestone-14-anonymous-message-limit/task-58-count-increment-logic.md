# Task 58: ChatRoom DO Count Increment Logic

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Add logic to ChatRoom Durable Object to increment the Firestore message count after successfully saving an anonymous user's message. This ensures the count stays synchronized with actual message sends.

---

## Context

After a message is saved to Firestore (via `MessageDatabaseService.sendMessage`), the ChatRoom DO must increment the user's message count. This increment should be:
- Asynchronous (fire-and-forget) to avoid blocking the response
- Only for anonymous users (skip for authenticated users)
- Atomic to prevent lost increments under concurrent sends

**Insertion Point**: After `MessageDatabaseService.sendMessage` returns `savedMessage`, before broadcasting.

---

## Steps

### 1. Add Increment Call After Message Save

**File**: `src/durable-objects/chat-room.ts`

**Location**: Inside `handleMessage` method, after message save, before broadcast (around line 199)

**Before**:
```typescript
// Save user message to Firestore
const savedMessage = await MessageDatabaseService.sendMessage(
  conversationId,
  {
    sender_user_id: userId,
    content: message,
    role: 'user',
  },
  conversationType === 'chat' ? undefined : conversationType,
)

// Broadcast saved user message to all clients viewing this conversation
this.broadcastMessage({ type: 'message', message: savedMessage }, conversationId)
```

**After**:
```typescript
// Save user message to Firestore
const savedMessage = await MessageDatabaseService.sendMessage(
  conversationId,
  {
    sender_user_id: userId,
    content: message,
    role: 'user',
  },
  conversationType === 'chat' ? undefined : conversationType,
)

// === INCREMENT MESSAGE COUNT FOR ANONYMOUS USERS ===
if (isAnonymous && savedMessage) {
  // Fire-and-forget increment (don't await to avoid blocking)
  this.incrementMessageCount(userId).catch((err) => {
    log.error({ err, userId }, 'Failed to increment message count (non-blocking)')
  })
}
// === END INCREMENT ===

// Broadcast saved user message to all clients viewing this conversation
this.broadcastMessage({ type: 'message', message: savedMessage }, conversationId)
```

### 2. Ensure isAnonymous is in Scope

The `isAnonymous` variable from Task 57 validation should still be in scope. If not, hoist it:

```typescript
private async handleMessage(data: ClientMessage, socket: WebSocket): Promise<void> {
  const { userId, conversationId = 'main', message } = data

  if (!message) {
    this.sendMsg(socket, { type: 'error', error: 'No message provided' })
    return
  }

  // Hoist isAnonymous check to top of method
  const isAnonymous = await this.checkIfAnonymous(userId)

  // ... abort controller logic ...

  // === VALIDATION ===
  if (isAnonymous) {
    const stats = await this.getUserStats(userId)
    // ... limit check ...
  }

  // ... rest of method ...

  // === INCREMENT ===
  if (isAnonymous && savedMessage) {
    this.incrementMessageCount(userId).catch(...)
  }
}
```

### 3. Add Error Handling for Increment Failures

Ensure increment failures don't crash the ChatRoom:

```typescript
if (isAnonymous && savedMessage) {
  this.incrementMessageCount(userId).catch((err) => {
    // Log error but don't block message delivery
    log.error({ err, userId, messageId: savedMessage.id }, 'Increment failed (non-critical)')
  })
}
```

---

## Verification Checklist

- [ ] `incrementMessageCount(userId)` called after message save
- [ ] Increment only called for anonymous users (authenticated users skipped)
- [ ] Increment is fire-and-forget (`.catch()` instead of `await`)
- [ ] Error handling prevents crashes on increment failures
- [ ] `isAnonymous` variable in scope at increment location
- [ ] Increment happens before broadcast (optional but cleaner)
- [ ] No TypeScript errors
- [ ] Increment tested with rapid message sends

---

## Testing

**Manual Test (Single Message)**:
1. Sign in as anonymous user
2. Check Firestore: `agentbase.users/{uid}/stats/message_count` = 0
3. Send 1 message
4. Check Firestore: count should be 1
5. Verify `last_message_at` timestamp updated

**Manual Test (Multiple Messages)**:
1. Sign in as anonymous user
2. Send 5 messages
3. Check Firestore: count should be 5
4. Wait 1 second (ensure all increments processed)
5. Verify count is exactly 5 (no lost increments)

**Manual Test (Authenticated User)**:
1. Sign in with email/password
2. Send 10 messages
3. Check Firestore: user should have no `stats` document (or count = 0)
4. Verify no increments happen for authenticated users

**Race Condition Test**:
1. Send 10 messages rapidly (e.g., via script)
2. Check Firestore: count should be exactly 10
3. If count < 10, investigate lost increments (may need FieldValue.increment)

---

## Dependencies

- `incrementMessageCount(userId)` method (Task 55)
- `isAnonymous` flag from validation logic (Task 57)
- Message save via `MessageDatabaseService.sendMessage`

---

## Notes

- **Fire-and-Forget**: We use `.catch()` instead of `await` to avoid blocking the message broadcast. Increment failures are logged but don't prevent message delivery.
- **Non-Critical Operation**: If increment fails, the worst case is the count is slightly off (e.g., 9 instead of 10). This is acceptable — we prefer message delivery over perfect count accuracy.
- **Atomic Increment**: Current implementation uses read-then-write (Task 55). If testing reveals lost increments, upgrade to `FieldValue.increment(1)` from firebase-admin SDK.
- **Performance**: Fire-and-forget increment adds minimal latency (~10ms to start Firestore write, actual write happens async).

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > ChatRoom DO — Server-Side Validation, increment logic)
