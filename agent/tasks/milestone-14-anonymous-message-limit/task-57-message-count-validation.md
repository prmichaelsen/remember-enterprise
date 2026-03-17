# Task 57: ChatRoom DO Message Count Validation

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 3
**Status**: Not Started

---

## Objective

Add server-side validation logic to ChatRoom Durable Object's `handleMessage` method to enforce the 10-message limit for anonymous users. Reject messages that exceed the limit with a structured error response.

---

## Context

This is the core server-side enforcement layer. Before processing any message, the ChatRoom DO checks if the user is anonymous and if their message count has reached the limit. If so, it rejects the message with a `limit_reached` error containing a sign-up URL.

**Enforcement Point**: Inside `handleMessage`, before calling `MessageDatabaseService.sendMessage`

---

## Steps

### 1. Add Validation Logic to handleMessage

**File**: `src/durable-objects/chat-room.ts`

**Location**: Inside `handleMessage` method, after abort controller logic, before message save (around line 173)

**Insert**:
```typescript
// === ANONYMOUS MESSAGE LIMIT VALIDATION ===
const isAnonymous = await this.checkIfAnonymous(userId)

if (isAnonymous) {
  const stats = await this.getUserStats(userId)
  const currentCount = stats?.message_count ?? 0

  if (currentCount >= ANON_MESSAGE_LIMIT) {
    // Reject message — limit reached
    this.sendMsg(socket, {
      type: 'error',
      error: 'limit_reached',
      message: `You've sent ${ANON_MESSAGE_LIMIT} messages. Sign up to continue!`,
      signupUrl: `/auth?mode=signup&redirect_url=${encodeURIComponent('/')}`,
    })

    log.info({ userId, currentCount }, 'Anonymous message limit reached')
    return // Early return — don't process message
  }
}
// === END VALIDATION ===
```

### 2. Update Method Signature (If Needed)

Ensure `handleMessage` is declared as `async`:

```typescript
private async handleMessage(data: ClientMessage, socket: WebSocket): Promise<void>
```

### 3. Add Debug Logging

Add log statement after validation passes:

```typescript
if (isAnonymous) {
  // ... validation logic ...

  // If we reach here, validation passed
  log.debug({ userId, currentCount }, 'Anonymous user under limit')
}
```

### 4. Test Validation Logic

Create a test scenario where the limit is reached:
1. Set `ANON_MESSAGE_LIMIT = 3` (lower for faster testing)
2. Send 3 messages as anonymous user
3. Send 4th message → should be rejected
4. Verify error response matches expected structure

---

## Verification Checklist

- [ ] Validation logic inserted in `handleMessage` before message save
- [ ] `checkIfAnonymous(userId)` called to determine user type
- [ ] `getUserStats(userId)` called to fetch current count
- [ ] Current count compared to `ANON_MESSAGE_LIMIT`
- [ ] If limit reached, `error` event sent to socket
- [ ] Error includes `type: 'error'`, `error: 'limit_reached'`
- [ ] Error includes custom `message` and `signupUrl` fields
- [ ] Early return prevents message from being saved
- [ ] Info log recorded for monitoring
- [ ] Debug log recorded for troubleshooting
- [ ] Authenticated users skip validation (no performance impact)
- [ ] No TypeScript errors
- [ ] Validation tested with anonymous and authenticated users

---

## Testing

**Manual Test (Happy Path — Under Limit)**:
1. Sign in as anonymous user
2. Send 5 messages
3. Verify all messages are accepted
4. Verify count increments in Firestore (Task 58 handles increment)

**Manual Test (Limit Reached)**:
1. Sign in as anonymous user
2. Send 9 messages → all accepted
3. Send 10th message → accepted (count becomes 10)
4. Send 11th message → **rejected** with `limit_reached` error
5. Verify error includes `signupUrl`
6. Verify message not saved to Firestore
7. Verify client receives error and shows SignupCta (Task 54)

**Manual Test (Authenticated User)**:
1. Sign in with email/password
2. Send 20 messages
3. Verify all messages accepted (no limit)

**Load Test (Concurrent Messages)**:
1. Send 100 messages rapidly from same anonymous UID
2. Verify first 10 accepted, rest rejected
3. Check Firestore count = 10 (no over-increment)

---

## Dependencies

- `checkIfAnonymous(userId)` method (Task 56)
- `getUserStats(userId)` method (Task 55)
- `ANON_MESSAGE_LIMIT` constant (Task 55)

---

## Notes

- **Performance**: Validation adds ~50ms latency (1 Firestore read for `isAnonymous`, 1 for `message_count`). Caching (Task 56) reduces this to ~25ms.
- **Race Condition**: If user sends multiple messages rapidly, they might all pass validation before first increment completes. This is acceptable — worst case is user gets 11-12 messages instead of 10. Atomic increment (Task 58) mitigates this.
- **Error Structure**: Use structured error with `type` field so client can detect and handle specially (Task 54).
- **Sign-Up URL**: Hardcoded to `/auth?mode=signup` — could be enhanced to use `request.headers.host` for dynamic URL.

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > ChatRoom DO — Server-Side Validation, handleMessage logic)
