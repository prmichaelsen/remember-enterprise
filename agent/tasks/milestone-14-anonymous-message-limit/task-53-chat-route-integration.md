# Task 53: Integrate SignupCta into Chat Route

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Replace the MessageCompose component with SignupCta when an anonymous user reaches the 10-message limit. This provides a clear, unambiguous prompt to create an account.

---

## Context

When `anonLimitReached` is true, the entire MessageCompose area should be replaced with SignupCta. This follows the pattern from agentbase.me where the input is swapped (not just disabled) to make the limit clear to the user.

---

## Steps

### 1. Import SignupCta Component

**File**: `src/routes/chat/$conversationId.tsx`

**Location**: With other imports at top of file

```typescript
import { SignupCta } from '@/components/auth/SignupCta'
```

### 2. Replace MessageCompose Render Logic

**Location**: Around line 508-516 (the MessageCompose render block)

**Before**:
```typescript
<ErrorBoundary name="MessageCompose">
  <MessageCompose
    conversationId={conversationId}
    senderId={user?.uid ?? ''}
    onSend={handleSend}
    onTypingStart={handleTypingStart}
    onTypingStop={handleTypingStop}
  />
</ErrorBoundary>
```

**After**:
```typescript
<ErrorBoundary name="MessageCompose">
  {anonLimitReached ? (
    <SignupCta message="You've sent 10 messages! Sign up to continue the conversation." />
  ) : (
    <MessageCompose
      conversationId={conversationId}
      senderId={user?.uid ?? ''}
      onSend={handleSend}
      onTypingStart={handleTypingStart}
      onTypingStop={handleTypingStop}
    />
  )}
</ErrorBoundary>
```

### 3. Test UI Replacement

Verify the swap happens cleanly:
- No layout shift
- Border styling consistent
- No flash of MessageCompose before SignupCta

### 4. Add Inline Comment

Document the conditional render:

```typescript
{/* Anonymous users: show sign-up prompt after 10 messages */}
{anonLimitReached ? (
  <SignupCta message="You've sent 10 messages! Sign up to continue the conversation." />
) : (
  <MessageCompose ... />
)}
```

---

## Verification Checklist

- [ ] SignupCta imported from `@/components/auth/SignupCta`
- [ ] MessageCompose render block wrapped in conditional
- [ ] Condition checks `anonLimitReached` flag (from Task 52)
- [ ] SignupCta displays custom message about 10-message limit
- [ ] MessageCompose still renders for authenticated users
- [ ] MessageCompose still renders for anonymous users with <10 messages
- [ ] ErrorBoundary wraps both branches (already in place)
- [ ] No layout shift when swapping components
- [ ] No TypeScript errors
- [ ] UI tested in both dark and light themes

---

## Testing

**Manual Test (Anonymous User)**:
1. Clear browser data (or use incognito mode)
2. Visit memorycloud.chat without signing in
3. Send 9 messages in chat
4. Verify MessageCompose is visible
5. Send 10th message
6. Verify SignupCta appears immediately (no page refresh needed)
7. Verify sign-up link redirects to `/auth?mode=signup&redirect_url=...`
8. Click "Sign Up"
9. Complete registration
10. Verify redirect back to conversation
11. Verify MessageCompose is now visible (authenticated)

**Manual Test (Authenticated User)**:
1. Sign in as authenticated user
2. Send >10 messages
3. Verify MessageCompose remains visible (no limit)

**Edge Case Test**:
1. Open two tabs with same anonymous session
2. Send 5 messages in tab 1
3. Send 5 messages in tab 2
4. Verify both tabs show SignupCta (client count is per-tab)
5. Server will enforce global count (tested in Task 59)

---

## Dependencies

- SignupCta component (Task 51)
- `anonLimitReached` flag (Task 52)
- MessageCompose component (already exists)

---

## Notes

- Use conditional render (ternary), not `disabled` prop — clearer UX
- Keep message text positive: "You've sent 10 messages!" emphasizes value delivered
- Sign-up CTA message is customizable via prop (can A/B test different copy)
- Server-side enforcement (Task 57) will prevent bypass even if client renders MessageCompose

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > Chat Route — Client-Side Gating)
