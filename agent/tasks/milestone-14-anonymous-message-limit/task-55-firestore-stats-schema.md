# Task 55: Firestore Stats Schema & Helper Methods

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 3
**Status**: Not Started

---

## Objective

Create Firestore schema for tracking anonymous user message counts and implement helper methods in ChatRoom Durable Object for reading, writing, and incrementing the count atomically.

---

## Context

The server needs to persist message counts in Firestore at path `agentbase.users/{uid}/stats/message_count`. This document uses atomic increments to prevent race conditions and includes a `last_message_at` timestamp for future rate limiting.

**Schema Design**:
- Path: `agentbase.users/{uid}/stats/message_count`
- Document ID: `default`
- Fields: `message_count` (number), `last_message_at` (timestamp)

---

## Steps

### 1. Add Constants to ChatRoom DO

**File**: `src/durable-objects/chat-room.ts`

**Location**: After imports, before class definition (around line 23)

```typescript
const ANON_MESSAGE_LIMIT = 10
```

### 2. Add Helper Method: getUserStats

**Location**: Inside `ChatRoom` class, after existing private methods (around line 410)

```typescript
/**
 * Fetch message count stats for a user from Firestore.
 * Returns null if stats document doesn't exist.
 */
private async getUserStats(userId: string): Promise<{ message_count: number } | null> {
  try {
    const doc = await getDocument(`agentbase.users/${userId}/stats`, 'message_count')
    return doc as { message_count: number } | null
  } catch (error) {
    log.error({ err: error, userId }, 'Failed to fetch user stats')
    return null
  }
}
```

### 3. Add Helper Method: incrementMessageCount

**Location**: After `getUserStats` method

```typescript
/**
 * Atomically increment message count for a user.
 * Creates the stats document if it doesn't exist.
 * Includes last_message_at timestamp for future rate limiting.
 */
private async incrementMessageCount(userId: string): Promise<void> {
  try {
    const statsPath = `agentbase.users/${userId}/stats/message_count`

    // Read current count
    const doc = await getDocument(statsPath, 'default')
    const currentCount = (doc?.message_count ?? 0) as number

    // Write incremented count + timestamp
    await setDocument(
      statsPath,
      'default',
      {
        message_count: currentCount + 1,
        last_message_at: new Date(),
      },
      { merge: true }
    )

    log.debug({ userId, newCount: currentCount + 1 }, 'Incremented message count')
  } catch (error) {
    log.error({ err: error, userId }, 'Failed to increment message count')
    // Don't block message send on count increment failure
    // This is a non-critical operation — worst case is count slightly off
  }
}
```

### 4. Add Firestore Imports

**Location**: Top of file, with other imports

```typescript
import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
```

### 5. Test Helper Methods (Optional)

Create a unit test or integration test:

**File**: `src/durable-objects/chat-room.test.ts` (if testing infrastructure exists)

```typescript
describe('ChatRoom UserStats', () => {
  it('getUserStats returns null for new user', async () => {
    const stats = await chatRoom.getUserStats('new-user-123')
    expect(stats).toBeNull()
  })

  it('incrementMessageCount creates stats doc', async () => {
    await chatRoom.incrementMessageCount('test-user-456')
    const stats = await chatRoom.getUserStats('test-user-456')
    expect(stats?.message_count).toBe(1)
  })

  it('incrementMessageCount increments atomically', async () => {
    // Send 3 messages
    await Promise.all([
      chatRoom.incrementMessageCount('test-user-789'),
      chatRoom.incrementMessageCount('test-user-789'),
      chatRoom.incrementMessageCount('test-user-789'),
    ])
    const stats = await chatRoom.getUserStats('test-user-789')
    expect(stats?.message_count).toBe(3)
  })
})
```

---

## Verification Checklist

- [ ] `ANON_MESSAGE_LIMIT` constant defined (value: 10)
- [ ] `getUserStats(userId)` method implemented
- [ ] `getUserStats` returns `null` for non-existent stats doc
- [ ] `getUserStats` returns `{ message_count: number }` for existing doc
- [ ] `incrementMessageCount(userId)` method implemented
- [ ] Increment uses read-then-write (not ideal but simple)
- [ ] Increment includes `last_message_at` timestamp
- [ ] Increment uses `merge: true` to preserve other fields
- [ ] Error handling prevents crashes on Firestore failures
- [ ] Debug logging added for troubleshooting
- [ ] Firestore imports added (getDocument, setDocument)
- [ ] No TypeScript errors
- [ ] (Optional) Unit tests pass

---

## Testing

**Manual Test (Check Firestore)**:
1. Deploy to staging
2. Sign in as anonymous user
3. Send 1 message
4. Open Firebase Console → Firestore
5. Navigate to `agentbase.users/{uid}/stats/message_count/default`
6. Verify `message_count: 1` and `last_message_at` timestamp exist
7. Send 2nd message
8. Verify count increments to 2

**Load Test (Race Conditions)**:
1. Write script to send 100 messages rapidly from same anonymous UID
2. Verify final count is 100 (no lost increments)
3. If count < 100, investigate race condition (may need FieldValue.increment)

---

## Dependencies

- `@prmichaelsen/firebase-admin-sdk-v8` for Firestore operations
- Firebase Admin SDK initialized in ChatRoom constructor (already done)

---

## Notes

- **Atomic Increment**: Current implementation uses read-then-write, which can lose increments under high concurrency. If testing reveals issues, upgrade to `FieldValue.increment(1)` from firebase-admin SDK.
- **Error Handling**: Count increment failures are logged but don't block message send. This is intentional — we prefer to allow messages through rather than block on stats failures.
- **last_message_at**: Timestamp enables future rate limiting (e.g., "max 1 message per 2 seconds"). Not used yet but included for future-proofing.
- **Stats Document**: Uses sub-document `message_count` under `stats` to avoid contention with `preferences` document.

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > ChatRoom DO — Server-Side Validation, Data Model)
