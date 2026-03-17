# Task 52: Add Client-Side Message Count Logic

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Add client-side logic to count user messages from the chat history and determine when an anonymous user has reached the 10-message limit. This provides immediate UI feedback without requiring a server round-trip.

---

## Context

The client needs to count messages with `role === 'user'` from the `messages` array to determine when to replace MessageCompose with SignupCta. This count is session-based (resets on page refresh) but provides instant feedback. The server-side count (Task 57) is the authoritative source of truth.

**Pattern**: Port from agentbase.me's approach (see audit-22) but count from message history instead of localStorage.

---

## Steps

### 1. Add Count Constant

**File**: `src/routes/chat/$conversationId.tsx`

**Location**: After imports, before component definition (around line 43)

```typescript
const ANON_MESSAGE_LIMIT = 10
```

### 2. Add Count Derivation Logic

**Location**: Inside `ConversationView` component, after state declarations (around line 115)

```typescript
// Derive anonymous message count from current messages
const userMessageCount = messages.filter(
  m => m.role === 'user' && m.sender_user_id === user?.uid
).length

const anonLimitReached = !!(
  user?.isAnonymous &&
  userMessageCount >= ANON_MESSAGE_LIMIT
)
```

### 3. Verify Message Filtering Logic

Ensure the filter correctly identifies user messages:
- `role === 'user'` — excludes assistant/system messages
- `sender_user_id === user?.uid` — only count current user's messages (important for group chats)

### 4. Test Edge Cases

Add inline comments documenting edge cases:

```typescript
// Edge cases handled:
// - Group chats: only count current user's messages
// - Assistant responses: excluded by role filter
// - System messages: excluded by role filter
// - Streaming messages: not yet in messages array (counted server-side)
```

---

## Verification Checklist

- [ ] `ANON_MESSAGE_LIMIT` constant defined (value: 10)
- [ ] `userMessageCount` derives from `messages.filter(...)`
- [ ] Filter checks both `role === 'user'` AND `sender_user_id === user?.uid`
- [ ] `anonLimitReached` computes correctly for anonymous users
- [ ] `anonLimitReached` is false for authenticated users (even if >10 messages)
- [ ] Logic handles edge case: user is null (should not crash)
- [ ] Logic handles edge case: empty messages array (count = 0)
- [ ] Count updates reactively when messages array changes
- [ ] No TypeScript errors
- [ ] Count logic does not interfere with existing message rendering

---

## Testing

**Manual Test**:
1. Open browser DevTools
2. Sign in as anonymous user
3. Send messages in chat
4. Add breakpoint or console.log to verify count increments
5. Verify count resets on page refresh (session-based)

**Expected Behavior**:
- Count starts at 0
- Increments by 1 for each user message sent
- Does not increment for assistant responses
- Resets to 0 on page refresh

---

## Dependencies

- `messages` state array from route context
- `user` object with `uid` and `isAnonymous` flag from `useAuth()`

---

## Notes

- This is a **UX optimization** — provides instant feedback before server validates
- Server-side count (Task 57) is the authoritative source of truth
- Client count may drift slightly from server count (e.g., if user opens multiple tabs)
- On server-side `limit_reached` error, client will force-sync (Task 54)
- Count is per-conversation view (not global) — server tracks global count

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > Chat Route — Client-Side Gating)
