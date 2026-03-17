# Anonymous Message Limit with Server-Side Enforcement

**Concept**: Limit anonymous users to 10 message interactions before prompting account creation, with client-side UI gating AND server-side validation to prevent bypass attacks
**Created**: 2026-03-17
**Status**: Design Specification

---

## Overview

memorycloud.chat will enforce a 10-message soft limit for anonymous users through both client-side UI replacement and server-side message count validation. When an anonymous user sends 10 messages, the MessageCompose input is replaced with a SignupCta component, and the ChatRoom Durable Object rejects further message attempts with a 403 error. The count persists in Firestore tied to the anonymous user's UID, surviving page refreshes and preventing bypass via WebSocket manipulation.

This design ports agentbase.me's proven UX pattern while adding robust server-side enforcement to close the security gap identified in audit-22.

---

## Problem Statement

**Current State**: Anonymous users can send unlimited messages, creating friction-free onboarding but no conversion funnel.

**Desired State**: Anonymous users get a taste of the platform (10 messages) before being prompted to create an account, similar to agentbase.me but with enforcement that survives:
- Page refreshes
- Direct WebSocket message sending
- Client-side code manipulation
- Browser DevTools bypasses

**Why This Matters**:
- **Conversion funnel**: Drives anonymous users toward account creation at the right moment (after experiencing value)
- **Spam prevention**: Limits abuse from throwaway anonymous accounts
- **Resource management**: Prevents unlimited AI generation costs from anonymous users
- **Parity with agentbase.me**: Maintains consistent UX across the platform ecosystem

**Consequences of Not Solving**:
- No conversion pressure — anonymous users never upgrade
- Potential abuse vector for spam or cost exploitation
- Inconsistent experience across agentbase.me and memorycloud.chat

---

## Solution

Implement a two-layer enforcement system:

### Client-Side (UI Gating)
- Count user messages from the in-memory chat history
- When count reaches 10, replace MessageCompose with SignupCta component
- Provide immediate feedback without server round-trip

### Server-Side (Hard Enforcement)
- Track message count in Firestore (`agentbase.users/{uid}/stats/message_count`)
- ChatRoom Durable Object validates count before processing messages
- Reject with 403 error if anonymous user exceeds 10 messages
- Return structured error with sign-up URL

### Persistence Layer
- Store count in Firestore for durability across sessions
- Use atomic increments to prevent race conditions
- Count survives page refreshes, network interruptions, and client restarts

---

## Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Chat Route)                                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  1. Count messages in state (client-side)            │ │
│  │  2. When count >= 10 && isAnonymous:                 │ │
│  │     - Replace MessageCompose with SignupCta          │ │
│  │     - Disable send button                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ WebSocket: type='message'
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ChatRoom Durable Object                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  handleMessage(data):                                 │ │
│  │    1. Check if user isAnonymous (from session)       │ │
│  │    2. If anonymous, fetch message_count from         │ │
│  │       Firestore: agentbase.users/{uid}/stats         │ │
│  │    3. If count >= 10:                                │ │
│  │       - Send 'error' event with type='limit_reached' │ │
│  │       - Return early (no message save)               │ │
│  │    4. Else:                                          │ │
│  │       - Process message normally                     │ │
│  │       - Increment Firestore count atomically         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Firestore: agentbase.users/{uid}/stats                    │
│  {                                                          │
│    message_count: 8,          // atomic increment         │
│    last_message_at: timestamp // for rate limiting (P1)   │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

**Firestore Path**: `agentbase.users/{uid}/stats`

**Schema**:
```typescript
interface UserStats {
  message_count: number        // Total messages sent (all conversations)
  last_message_at?: Timestamp  // For future rate limiting (P1)
}
```

**Why This Path**:
- Reuses existing `agentbase.users` collection (shared with agentbase.me)
- `stats` sub-document avoids contention with `preferences` document
- Path is user-scoped, not conversation-scoped (limit applies across all conversations)

### Code Changes

#### 1. SignupCta Component (Port from agentbase.me)

**File**: `src/components/auth/SignupCta.tsx` (create)

```typescript
interface SignupCtaProps {
  message?: string
}

export function SignupCta({ message = 'Sign up to continue' }: SignupCtaProps) {
  const redirectUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/'

  return (
    <div className="px-4 py-3 bg-slate-900 border-t border-gray-800 text-center">
      <p className="text-sm text-gray-200 mb-2">{message}</p>
      <a
        href={`/auth?mode=signup&redirect_url=${encodeURIComponent(redirectUrl)}`}
        className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600
                   hover:from-blue-700 hover:to-cyan-700 text-white font-medium
                   rounded-lg transition-all text-sm"
      >
        Sign Up
      </a>
    </div>
  )
}
```

**Styling**: Adapt gradient colors to memorycloud.chat theme system via `useTheme()`.

#### 2. Chat Route — Client-Side Gating

**File**: `src/routes/chat/$conversationId.tsx`

**Changes**:
- Add `anonMessageLimit` prop to route context
- Compute `anonLimitReached` from messages array
- Conditionally render SignupCta instead of MessageCompose

```typescript
// Add to component state/derived values (around line 115)
const ANON_MESSAGE_LIMIT = 10
const userMessageCount = messages.filter(m => m.role === 'user' && m.sender_user_id === user?.uid).length
const anonLimitReached = !!(user?.isAnonymous && userMessageCount >= ANON_MESSAGE_LIMIT)

// Replace MessageCompose render (around line 509)
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
```

#### 3. ChatRoom DO — Server-Side Validation

**File**: `src/durable-objects/chat-room.ts`

**Changes**: Add validation logic to `handleMessage` method before saving message.

```typescript
// Add import at top
import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'

// Add constant
const ANON_MESSAGE_LIMIT = 10

// In handleMessage (insert after line 173, before message save)
private async handleMessage(data: ClientMessage, socket: WebSocket): Promise<void> {
  const { userId, conversationId = 'main', message } = data

  if (!message) {
    this.sendMsg(socket, { type: 'error', error: 'No message provided' })
    return
  }

  // === NEW: Anonymous message limit validation ===
  const isAnonymous = await this.checkIfAnonymous(userId)

  if (isAnonymous) {
    const stats = await this.getUserStats(userId)
    const currentCount = stats?.message_count ?? 0

    if (currentCount >= ANON_MESSAGE_LIMIT) {
      this.sendMsg(socket, {
        type: 'error',
        error: 'limit_reached',
        message: `You've sent ${ANON_MESSAGE_LIMIT} messages. Sign up to continue!`,
        signupUrl: `/auth?mode=signup&redirect_url=${encodeURIComponent('/')}`,
      })
      return
    }
  }
  // === END NEW ===

  // ... existing code continues (abort controller, save message, etc.)

  // === NEW: Increment count after successful save (insert after line 199) ===
  if (isAnonymous && savedMessage) {
    await this.incrementMessageCount(userId)
  }
  // === END NEW ===
}

// Add helper methods at bottom of class
private async checkIfAnonymous(userId: string): Promise<boolean> {
  // Check if user has anonymous session cookie or no email
  // This can be determined from the WebSocket upgrade request headers
  // For now, query Firestore to check user's auth provider
  try {
    const userDoc = await getDocument(`agentbase.users/${userId}`, 'profile')
    return userDoc?.isAnonymous === true
  } catch {
    // If we can't determine, assume not anonymous (safer default)
    return false
  }
}

private async getUserStats(userId: string): Promise<{ message_count: number } | null> {
  try {
    const doc = await getDocument(`agentbase.users/${userId}/stats`, 'message_count')
    return doc as { message_count: number } | null
  } catch {
    return null
  }
}

private async incrementMessageCount(userId: string): Promise<void> {
  try {
    const statsRef = `agentbase.users/${userId}/stats/message_count`
    const doc = await getDocument(statsRef, 'default')
    const currentCount = (doc?.message_count ?? 0) as number

    await setDocument(statsRef, 'default', {
      message_count: currentCount + 1,
      last_message_at: new Date(),
    }, { merge: true })
  } catch (error) {
    log.error({ err: error }, 'Failed to increment message count')
    // Don't block message send on count increment failure
  }
}
```

**Note**: The `checkIfAnonymous` method should ideally use the decoded session token (from WebSocket upgrade request headers) rather than querying Firestore. This requires passing the auth context through to the DO.

#### 4. Auth Session Enhancement

**File**: `src/lib/auth/session.ts`

**Change**: Export `isAnonymous` flag in session object (already implemented on line 33-35).

**Validation**: Ensure `isAnonymous` is available in `getServerSession()` return value and used in ChatRoom DO.

#### 5. Client-Side Error Handling

**File**: `src/routes/chat/$conversationId.tsx`

**Change**: Handle `limit_reached` error from WebSocket.

```typescript
// In WebSocket message handler (around line 244)
case 'error': {
  const event = wsMessage as any

  if (event.error === 'limit_reached') {
    // Force UI to show SignupCta even if client-side count is off
    setMessages([]) // Clear messages to force re-render
    // Optionally, show a toast notification
  } else {
    console.error('[WebSocket] Error:', event.error)
  }

  setStreamingBlocks([])
  streamingMessageIdRef.current = null
  break
}
```

---

## Benefits

- **Security**: Server-side enforcement prevents all bypass attacks (WebSocket manipulation, localStorage tampering, client-side code changes)
- **Durability**: Count persists across page refreshes, network interruptions, and browser sessions
- **UX Consistency**: Matches agentbase.me's proven pattern while closing security gaps
- **Conversion Funnel**: Prompts sign-up at the right moment (after 10 messages of value)
- **Spam Prevention**: Limits abuse from throwaway anonymous accounts
- **Resource Management**: Caps AI generation costs per anonymous UID
- **Graceful Degradation**: Client-side gating provides immediate feedback; server validation is backup

---

## Trade-offs

### Performance: Additional Firestore Read/Write Per Message
**Impact**: ~50ms latency per message send (Firestore read + write)

**Mitigation**:
- Cache `isAnonymous` flag in ChatRoom DO session state after first check
- Use atomic increment (FieldValue.increment) to avoid read-before-write
- Only check for anonymous users (skip for authenticated users after upgrade)

### Complexity: Two Enforcement Layers
**Impact**: More code to maintain, potential for client/server count drift

**Mitigation**:
- Treat server count as source of truth
- Client-side count is UX optimization only (can be slightly off)
- On limit_reached error, force client to sync by clearing state

### Firestore Contention: Stats Document Writes
**Impact**: Potential write contention if user sends messages rapidly

**Mitigation**:
- `stats` sub-document is separate from `preferences` (no cross-document contention)
- Atomic increment prevents lost updates
- Use `merge: true` to avoid overwriting other fields

### Cross-App Sharing: Count is Global Across agentbase.me + memorycloud.chat
**Impact**: 10 messages total across both apps, not 10 per app

**Mitigation**: Document this as intended behavior — unified identity, unified limit.

---

## Dependencies

- `@prmichaelsen/firebase-admin-sdk-v8` — Firestore read/write/increment operations
- Existing `getServerSession()` with `isAnonymous` flag
- Existing `SignupCta` component pattern from agentbase.me (port to memorycloud.chat)
- Existing `/auth?mode=signup&redirect_url=` auth flow

---

## Testing Strategy

### Unit Tests
- `SignupCta` component renders with custom message
- `SignupCta` component generates correct redirect URL
- Client-side message count logic (filter by role='user')

### Integration Tests
1. **Client-Side Gating**:
   - Send 9 messages as anonymous user → MessageCompose visible
   - Send 10th message → SignupCta replaces MessageCompose
   - Message input is disabled

2. **Server-Side Enforcement**:
   - Send 9 messages via WebSocket → all accepted
   - Send 10th message → accepted
   - Send 11th message → rejected with `limit_reached` error
   - Verify Firestore `message_count` increments correctly

3. **Persistence Across Sessions**:
   - Send 5 messages as anonymous user
   - Close tab, reopen
   - Send 5 more messages → should work
   - Send 1 more message → should be rejected (count persisted)

4. **Bypass Attempts**:
   - Modify localStorage → server still enforces
   - Send WebSocket message with manipulated count → server rejects
   - Send messages directly via Firestore API → (out of scope, requires Security Rules)

### Security Tests
- Anonymous user cannot exceed 10 messages via any client method
- Authenticated user (post-upgrade) has unlimited messages
- Anonymous UID count resets after upgrade (or carries forward? — design decision)

### Performance Benchmarks
- Measure latency added by Firestore read/write (target: <100ms)
- Verify atomic increment prevents lost updates under concurrent load

---

## Migration Path

### Phase 1: Deploy Client-Side Gating (Soft Launch)
1. Deploy SignupCta component
2. Add client-side count logic to chat route
3. Test UX flow with anonymous users
4. Collect metrics on sign-up conversion rate

### Phase 2: Deploy Server-Side Enforcement (Hardening)
1. Add `stats` document writes to ChatRoom DO
2. Add validation logic (reject on limit)
3. Deploy to staging, test bypass scenarios
4. Deploy to production with monitoring

### Phase 3: Monitoring & Iteration
1. Track anonymous message count distribution
2. Monitor sign-up conversion funnel (10 messages → sign-up)
3. A/B test limit threshold (8 vs 10 vs 12 messages)
4. Collect user feedback on sign-up prompts

### Rollback Plan
- Remove server-side validation, keep client-side gating (soft limit only)
- If Firestore write latency is unacceptable, cache counts in DO state (non-durable)

---

## Key Design Decisions

### Enforcement Strategy

| Decision | Choice | Rationale |
|---|---|---|
| **Enforcement Layers** | Client-side (UI) + Server-side (hard block) | Client provides instant feedback; server prevents bypasses |
| **Server-Side Validation Location** | ChatRoom Durable Object | Centralized, already handles all message sending |
| **Persistence Layer** | Firestore `agentbase.users/{uid}/stats` | Durable, atomic increments, shared with agentbase.me |
| **Count Scope** | Global across all conversations | Simpler to implement, unified limit per user |
| **Count Reset on Upgrade** | No reset (carries forward) | Incentivizes sign-up, prevents gaming system |

### Data Model

| Decision | Choice | Rationale |
|---|---|---|
| **Firestore Path** | `agentbase.users/{uid}/stats/message_count` | Reuses existing collection, separate sub-doc avoids contention |
| **Count Granularity** | Per-user, not per-conversation | User-level limit is clearer, prevents multi-conversation gaming |
| **Atomic Increment** | Use `FieldValue.increment(1)` | Prevents race conditions from concurrent message sends |
| **Additional Fields** | `last_message_at` (timestamp) | Enables future rate limiting, audit logging |

### UX Pattern

| Decision | Choice | Rationale |
|---|---|---|
| **Limit Value** | 10 messages (hardcoded constant) | Matches agentbase.me, proven conversion point |
| **UI Replacement** | Swap entire MessageCompose with SignupCta | Clear, unambiguous — no partial-disabled states |
| **Sign-Up CTA Message** | "You've sent 10 messages! Sign up to continue." | Positive framing, emphasizes value delivered |
| **Redirect After Sign-Up** | Back to current conversation | Minimize disruption, preserve context |

### Security & Bypass Prevention

| Decision | Choice | Rationale |
|---|---|---|
| **Client Trust** | Zero trust (server validates all messages) | Prevents WebSocket manipulation, DevTools bypasses |
| **Anonymous Detection** | From session cookie (`isAnonymous` flag) | Already implemented, reliable source of truth |
| **Error Response** | Structured JSON with `type: 'limit_reached'` | Client can detect and show custom UI |
| **Firestore Security Rules** | No additional rules (rely on server SDK) | ChatRoom DO uses admin SDK, bypasses rules |

### Performance Optimization

| Decision | Choice | Rationale |
|---|---|---|
| **Cache isAnonymous Flag** | Cache in DO session state after first check | Avoid repeated Firestore reads for profile doc |
| **Lazy Count Check** | Only check count for anonymous users | Skip validation for authenticated users (fast path) |
| **Async Count Increment** | Fire-and-forget after message save | Don't block message delivery on count update |

---

## Future Considerations

### P1 (Next Iteration)
- **Rate Limiting**: Use `last_message_at` to prevent rapid-fire spam (e.g., max 1 message per 2 seconds)
- **Per-Conversation Limits**: Track count per-conversation to prevent gaming across multiple chats
- **Localized Sign-Up CTA**: Translate message for i18n support
- **A/B Test Limit Threshold**: Test 8 vs 10 vs 12 messages for optimal conversion

### P2 (Future Enhancements)
- **Gradual Limit Increase**: Authenticated users with low activity get higher limits
- **Limit Bypass for Verified Users**: Phone-verified anonymous users get higher limits
- **Admin Override**: Allow admins to grant unlimited messages to specific anonymous UIDs
- **Analytics Dashboard**: Track conversion funnel metrics (messages sent → sign-up rate)

### P3 (Long-Term Vision)
- **Dynamic Limits Based on Behavior**: ML model predicts spam vs legitimate users, adjusts limits
- **Tiered Anonymous Access**: Free tier (10 messages), paid tier (unlimited with anonymous UID)
- **Cross-Platform Sync**: Share count across mobile app (agentbase-mobile) and web

---

**Status**: Design Specification
**Recommendation**: Implement in two phases — client-side gating first (quick win), server-side enforcement second (security hardening)
**Related Documents**:
- [agent/reports/audit-22-agentbase-anon-message-limit.md](../reports/audit-22-agentbase-anon-message-limit.md) — Audit of agentbase.me implementation
- [agent/patterns/tanstack-cloudflare.firebase-anonymous-sessions.md](../patterns/tanstack-cloudflare.firebase-anonymous-sessions.md) — Anonymous session lifecycle pattern (if exists)
- [agent/design/local.requirements.md](local.requirements.md) — Product requirements
