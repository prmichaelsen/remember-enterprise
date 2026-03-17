# Task 59: Integration Testing & Bypass Prevention

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 4
**Status**: Not Started

---

## Objective

Comprehensive integration testing of the anonymous message limit system, including bypass prevention tests. Verify that the limit works correctly across page refreshes, multiple tabs, WebSocket manipulation attempts, and localStorage tampering.

---

## Context

This task validates the entire anonymous message limit system end-to-end. It ensures that:
- Client-side gating works (immediate feedback)
- Server-side enforcement works (bypass prevention)
- Count persists across sessions
- Authenticated users bypass limit
- Security vulnerabilities are closed

**Testing Scope**: Client-side UI, server-side validation, Firestore persistence, cross-tab behavior, bypass attempts.

---

## Test Cases

### 1. Happy Path — Client-Side Gating

**Objective**: Verify client-side UI replacement at 10 messages

**Steps**:
1. Clear browser data, visit memorycloud.chat
2. As anonymous user, send 9 messages
3. Verify MessageCompose is visible
4. Send 10th message
5. Verify SignupCta replaces MessageCompose immediately
6. Verify sign-up link points to `/auth?mode=signup&redirect_url=...`

**Expected**:
- MessageCompose visible for messages 1-9
- SignupCta visible after message 10
- No page refresh needed for UI update
- Sign-up link includes current URL as redirect

---

### 2. Happy Path — Server-Side Enforcement

**Objective**: Verify server rejects 11th message

**Steps**:
1. Clear browser data, visit memorycloud.chat
2. As anonymous user, send 10 messages
3. Use browser DevTools → WebSocket tab
4. Manually send 11th message via WebSocket
5. Verify server responds with `limit_reached` error
6. Verify 11th message not saved to Firestore

**Expected**:
- First 10 messages accepted by server
- 11th message rejected with `limit_reached` error
- Error includes `signupUrl` field
- Firestore count = 10 (not 11)

---

### 3. Persistence Across Page Refresh

**Objective**: Verify count survives page refresh

**Steps**:
1. Clear browser data, visit memorycloud.chat
2. As anonymous user, send 5 messages
3. Refresh page
4. Send 5 more messages → should work
5. Send 1 more message → should be rejected

**Expected**:
- Count persists in Firestore across refresh
- Server validates against persisted count (not session count)
- Client count resets on refresh but server enforces global count

---

### 4. Multiple Tabs (Same Anonymous Session)

**Objective**: Verify count is global across tabs

**Steps**:
1. Clear browser data, visit memorycloud.chat in Tab 1
2. Open Tab 2 with same anonymous session
3. Send 5 messages in Tab 1
4. Send 5 messages in Tab 2
5. Try to send 1 more message in either tab

**Expected**:
- Server counts messages across both tabs (global limit)
- First tab to send 11th message gets rejected
- Both tabs show SignupCta (via error handler Task 54)

---

### 5. Authenticated User Bypass

**Objective**: Verify authenticated users have unlimited messages

**Steps**:
1. Sign up for account
2. Send 20 messages
3. Verify all messages accepted

**Expected**:
- No limit applied
- MessageCompose always visible
- No Firestore `stats` document created (or count not incremented)

---

### 6. Bypass Attempt: WebSocket Manipulation

**Objective**: Verify server rejects manipulated messages

**Steps**:
1. Send 10 messages as anonymous user
2. Open DevTools → WebSocket tab
3. Manually send WebSocket message with `type: 'message'`
4. Verify server rejects (limit_reached error)

**Expected**:
- Server validates count before processing
- Manipulation attempt caught and rejected
- Error logged in server logs

---

### 7. Bypass Attempt: localStorage Tampering

**Objective**: Verify server ignores client-side state

**Steps**:
1. Send 10 messages as anonymous user
2. Open DevTools → Application → localStorage
3. Clear all localStorage items
4. Try to send 11th message via UI
5. Verify server still rejects (server count = 10)

**Expected**:
- Client UI may show MessageCompose (client count reset)
- Server rejects based on Firestore count (source of truth)
- Error handler (Task 54) forces client to sync

---

### 8. Bypass Attempt: Count Reset via Firestore

**Objective**: Verify user cannot reset count by deleting stats doc

**Steps**:
1. Send 10 messages as anonymous user
2. Open Firebase Console → Firestore
3. Delete `agentbase.users/{uid}/stats/message_count` document
4. Try to send 11th message
5. Verify server allows (count = 0 after deletion)

**Expected**:
- Deleting stats doc resets count (this is acceptable — requires Firebase Console access)
- User can send another 10 messages
- Admin monitoring can detect multiple resets (future enhancement)

---

### 9. Anonymous Upgrade Flow

**Objective**: Verify count carries forward after upgrade

**Steps**:
1. Send 8 messages as anonymous user
2. Click "Sign Up", complete registration
3. Verify redirect back to conversation
4. Try to send 3 more messages (total 11)
5. Verify messages rejected (count carried forward)

**Expected**:
- Anonymous UID preserved after upgrade (Firebase Auth feature)
- Count carries forward from anonymous session
- User needs to reach 10 total messages before limit applies
- (Alternative design decision: reset count on upgrade)

---

### 10. Race Condition: Concurrent Message Sends

**Objective**: Verify atomic increment prevents lost counts

**Steps**:
1. Write script to send 20 messages rapidly (e.g., via WebSocket)
2. Check Firestore: count should be 10 (first 10 accepted, rest rejected)
3. Verify no messages 11-20 saved to Firestore

**Expected**:
- Count = 10 (no lost increments)
- Messages 11-20 rejected
- No race condition vulnerabilities

---

## Verification Checklist

- [ ] Test case 1 (client-side gating) passes
- [ ] Test case 2 (server-side enforcement) passes
- [ ] Test case 3 (persistence across refresh) passes
- [ ] Test case 4 (multiple tabs) passes
- [ ] Test case 5 (authenticated user bypass) passes
- [ ] Test case 6 (WebSocket manipulation bypass) fails (server rejects)
- [ ] Test case 7 (localStorage tampering bypass) fails (server rejects)
- [ ] Test case 8 (Firestore reset) documented as acceptable risk
- [ ] Test case 9 (anonymous upgrade) passes (count carries forward)
- [ ] Test case 10 (race condition) passes (no lost increments)
- [ ] All tests pass on staging environment
- [ ] All tests pass on production environment (post-deployment)
- [ ] Performance: Latency <100ms per message (Firestore read/write)
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console
- [ ] No errors in server logs (except expected limit_reached logs)

---

## Monitoring & Metrics

**Metrics to Track**:
- Anonymous user sign-up conversion rate (10 messages → sign-up)
- Average messages sent before sign-up
- Server-side reject rate (% of messages rejected by limit)
- Firestore read/write latency for message counts
- Error rate (increment failures, validation failures)

**Logging**:
- Info log when limit reached: `{ userId, currentCount: 10 }`
- Error log on increment failure: `{ err, userId }`
- Debug log for validation: `{ userId, currentCount, isAnonymous }`

---

## Rollback Plan

If critical issues found during testing:
1. **Disable server-side validation** (comment out validation logic in Task 57)
2. **Keep client-side gating** (soft limit only)
3. **Deploy hotfix** to remove server-side enforcement
4. **Investigate issue** offline
5. **Re-deploy with fix** after testing

---

## Dependencies

- All tasks 51-58 completed
- Staging environment with Firestore access
- Browser DevTools for WebSocket inspection
- Firebase Console for Firestore inspection
- Test script for concurrent message sends

---

## Notes

- **Test Environment**: Run tests on staging first, then production
- **Data Cleanup**: Use separate test UIDs for each test case to avoid count contamination
- **Monitoring**: Set up alerts for high reject rates (may indicate bugs)
- **User Feedback**: Collect feedback on sign-up prompts and conversion rate

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Testing Strategy)
