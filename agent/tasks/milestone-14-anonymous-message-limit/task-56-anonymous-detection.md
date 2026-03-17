# Task 56: ChatRoom DO Anonymous Detection

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Implement a method in ChatRoom Durable Object to detect whether a user is anonymous based on their session data. This determines whether to enforce the message limit.

---

## Context

The ChatRoom DO needs to know if a userId represents an anonymous session or an authenticated user. The `isAnonymous` flag is already tracked in the session (see `src/lib/auth/session.ts:33-35`). The DO should check this flag to determine whether to apply the 10-message limit.

**Approach**: Query Firestore for the user's profile document which includes the `isAnonymous` flag. Ideally, this flag would be passed via WebSocket upgrade headers, but for simplicity we'll query Firestore.

---

## Steps

### 1. Add Helper Method: checkIfAnonymous

**File**: `src/durable-objects/chat-room.ts`

**Location**: After `getUserStats` method (around line 420)

```typescript
/**
 * Check if a user is anonymous based on their Firestore profile.
 * Returns true if user has isAnonymous flag set, false otherwise.
 * Defaults to false (safer) if profile can't be fetched.
 */
private async checkIfAnonymous(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDocument(`agentbase.users/${userId}`, 'profile')
    return userDoc?.isAnonymous === true
  } catch (error) {
    log.error({ err: error, userId }, 'Failed to check isAnonymous flag')
    // Default to non-anonymous (safer — don't accidentally block authenticated users)
    return false
  }
}
```

### 2. Add Caching for Performance (Optional Enhancement)

To reduce Firestore reads, cache the `isAnonymous` flag per session:

```typescript
export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, string> = new Map()
  private sessionConversations: Map<WebSocket, string> = new Map()
  private activeControllers: Map<string, AbortController> = new Map()
  private mcpProvider: MCPProvider
  private request?: Request

  // NEW: Cache isAnonymous flag per userId
  private anonCache: Map<string, boolean> = new Map()

  // ... existing constructor ...

  /**
   * Check if a user is anonymous, with caching to reduce Firestore reads.
   */
  private async checkIfAnonymous(userId: string): Promise<boolean> {
    // Check cache first
    if (this.anonCache.has(userId)) {
      return this.anonCache.get(userId)!
    }

    // Query Firestore
    try {
      const userDoc = await getDocument(`agentbase.users/${userId}`, 'profile')
      const isAnon = userDoc?.isAnonymous === true

      // Cache result
      this.anonCache.set(userId, isAnon)

      return isAnon
    } catch (error) {
      log.error({ err: error, userId }, 'Failed to check isAnonymous flag')
      return false
    }
  }
}
```

### 3. Add Cache Invalidation on Upgrade (Optional)

When a user upgrades from anonymous to authenticated, clear the cache:

```typescript
// In handleMessage or init handler, detect if user upgraded
if (this.anonCache.get(userId) === true && !isAnonymousNow) {
  this.anonCache.delete(userId)
  log.info({ userId }, 'User upgraded from anonymous to authenticated')
}
```

---

## Verification Checklist

- [ ] `checkIfAnonymous(userId)` method implemented
- [ ] Method queries `agentbase.users/{userId}/profile` document
- [ ] Method returns `true` if `isAnonymous === true`
- [ ] Method returns `false` by default (safe default)
- [ ] Error handling prevents crashes on Firestore failures
- [ ] Error logging added for debugging
- [ ] (Optional) Cache implemented to reduce Firestore reads
- [ ] (Optional) Cache invalidation on user upgrade
- [ ] No TypeScript errors
- [ ] Method tested with anonymous and authenticated users

---

## Testing

**Manual Test (Anonymous User)**:
1. Clear browser data (or use incognito mode)
2. Visit memorycloud.chat without signing in
3. Send a message
4. In server logs, verify `checkIfAnonymous` returns `true`
5. Verify Firestore query to `agentbase.users/{uid}/profile` succeeds

**Manual Test (Authenticated User)**:
1. Sign in with email/password
2. Send a message
3. In server logs, verify `checkIfAnonymous` returns `false`
4. Verify no message limit applied

**Manual Test (Cache Performance)**:
1. Enable caching
2. Send 10 messages as anonymous user
3. Check logs for Firestore read count
4. Should see 1 read (cached for subsequent messages)

---

## Dependencies

- `getDocument` from `@prmichaelsen/firebase-admin-sdk-v8`
- Firestore profile document with `isAnonymous` flag (already exists from auth setup)

---

## Notes

- **Default to False**: If we can't determine anonymity, assume authenticated. This is safer — we'd rather not block authenticated users by mistake.
- **Cache Benefits**: Reduces Firestore reads from 10 (one per message) to 1 (cached for session). Significant performance improvement.
- **Cache Invalidation**: If user upgrades mid-session, cache becomes stale. Detection of upgrade state can be added as enhancement.
- **Alternative Approach**: Pass `isAnonymous` flag via WebSocket upgrade headers. Requires changes to WebSocket client and server handshake. More efficient but higher complexity.

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > ChatRoom DO — Server-Side Validation, checkIfAnonymous method)
