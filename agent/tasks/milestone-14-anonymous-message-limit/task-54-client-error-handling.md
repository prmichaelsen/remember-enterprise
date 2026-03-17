# Task 54: Client-Side Error Handling for Limit

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Handle the server-side `limit_reached` error gracefully on the client. When the server rejects a message due to the anonymous limit, force the client UI to sync by clearing messages and showing SignupCta.

---

## Context

Even with client-side gating, the server may reject messages if:
- Client count drifts from server count (multiple tabs, page refresh, etc.)
- User bypasses client-side UI (WebSocket manipulation, DevTools)

When the server sends a `limit_reached` error, the client must handle it gracefully to prevent confusion.

---

## Steps

### 1. Add Error Handler to WebSocket Message Switch

**File**: `src/routes/chat/$conversationId.tsx`

**Location**: Inside WebSocket message handler, around line 244 (the `case 'error':` block)

**Before**:
```typescript
case 'error': {
  const event = wsMessage as any
  console.error('[WebSocket] Error:', event.error)
  setStreamingBlocks([])
  streamingMessageIdRef.current = null
  break
}
```

**After**:
```typescript
case 'error': {
  const event = wsMessage as any

  // Handle anonymous message limit error specially
  if (event.error === 'limit_reached') {
    // Force UI to show SignupCta by clearing messages state
    // This ensures client count re-syncs with server
    setMessages([])

    // Optionally, show a toast notification
    // TODO: Add toast notification when toast system is available
    console.warn('[WebSocket] Anonymous message limit reached')
  } else {
    console.error('[WebSocket] Error:', event.error)
  }

  setStreamingBlocks([])
  streamingMessageIdRef.current = null
  break
}
```

### 2. Add Structured Error Type (Optional Enhancement)

If time permits, define a structured error type:

**File**: `src/types/websocket.ts`

```typescript
interface ServerErrorEvent extends WebSocketMessage {
  type: 'error'
  error: string | 'limit_reached'
  message?: string
  signupUrl?: string
}
```

Then use it in the handler:

```typescript
case 'error': {
  const event = wsMessage as ServerErrorEvent

  if (event.error === 'limit_reached') {
    setMessages([])
    console.warn('[WebSocket]', event.message || 'Message limit reached')
    // Could use event.signupUrl if provided by server
  } else {
    console.error('[WebSocket] Error:', event.error)
  }

  setStreamingBlocks([])
  streamingMessageIdRef.current = null
  break
}
```

### 3. Test Error Handling

Manually trigger a `limit_reached` error to verify:
1. Client clears messages state
2. SignupCta appears (because `anonLimitReached` becomes true)
3. No console errors or crashes
4. User can click "Sign Up" and complete flow

---

## Verification Checklist

- [ ] `case 'error':` block handles `limit_reached` specifically
- [ ] `setMessages([])` forces client to re-sync count
- [ ] Console warning logged for debugging
- [ ] Streaming blocks cleared (no partial assistant response)
- [ ] No TypeScript errors
- [ ] UI tested: SignupCta appears after error
- [ ] (Optional) Structured error type defined
- [ ] (Optional) Toast notification shown

---

## Testing

**Manual Test (Simulate Server Error)**:
1. Open browser DevTools → Network tab → WebSocket tab
2. Sign in as anonymous user
3. Send messages until limit reached
4. In DevTools, manually send a WebSocket message (simulate 11th message)
5. Server should respond with `limit_reached` error
6. Verify client handles error gracefully (no crash)
7. Verify SignupCta appears

**Alternative Test (Direct Server Bypass)**:
1. Modify `handleMessage` in `chat-room.ts` to always return `limit_reached` error
2. Deploy to staging
3. Test client behavior
4. Revert change

---

## Dependencies

- WebSocket message handler in `src/routes/chat/$conversationId.tsx`
- Server-side `limit_reached` error from ChatRoom DO (Task 57)

---

## Notes

- Clearing `messages` state forces `userMessageCount` to 0, which makes `anonLimitReached` true
- Alternative approach: Set a flag `forceSignupCta` instead of clearing messages
- Clearing messages is simpler and more foolproof
- User can refresh page to see messages again (but limit still enforced server-side)
- Toast notification is optional — can add in future iteration

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > Client-Side Error Handling)
