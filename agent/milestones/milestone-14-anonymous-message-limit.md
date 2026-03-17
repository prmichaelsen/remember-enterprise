# Milestone 14: Anonymous Message Limit

**Goal**: Implement two-layer anonymous user message limit (10 messages) with client-side UI gating and server-side enforcement to drive sign-up conversion
**Duration**: 2-3 weeks
**Dependencies**: None (all infrastructure in place)
**Status**: Not Started

---

## Overview

Port agentbase.me's proven anonymous message limit pattern to memorycloud.chat with robust server-side enforcement. Anonymous users get 10 free messages to experience the platform before being prompted to create an account. The limit is enforced both client-side (immediate UI feedback) and server-side (bypass prevention) with persistent tracking in Firestore.

This milestone closes the conversion funnel gap and prevents abuse from throwaway anonymous accounts while maintaining a friction-free onboarding experience.

---

## Deliverables

### Phase 1: Client-Side Gating (Soft Launch)
1. **SignupCta Component** — Sign-up prompt component with redirect-back logic
2. **Client-Side Count Logic** — Count user messages from chat history
3. **UI Replacement** — Replace MessageCompose with SignupCta when limit reached
4. **Error Handling** — Handle server-side `limit_reached` errors gracefully

### Phase 2: Server-Side Enforcement (Hardening)
5. **Firestore Stats Schema** — `agentbase.users/{uid}/stats/message_count` document
6. **Anonymous Detection** — Check `isAnonymous` flag in ChatRoom DO
7. **Count Validation** — Reject messages from anonymous users exceeding 10 messages
8. **Count Increment** — Atomic increment on message send
9. **Integration Tests** — Test bypass scenarios and persistence

---

## Success Criteria

- [ ] SignupCta component renders with theme-aware styling
- [ ] Client-side count logic correctly filters user messages
- [ ] MessageCompose replaced with SignupCta when anonymous user sends 10th message
- [ ] Server-side validation rejects 11th message with `limit_reached` error
- [ ] Firestore `message_count` increments atomically (no race conditions)
- [ ] Count persists across page refreshes and sessions
- [ ] Authenticated users bypass limit (unlimited messages)
- [ ] Anonymous detection works via session cookie (`isAnonymous` flag)
- [ ] Sign-up CTA redirects back to current conversation after registration
- [ ] No bypass via WebSocket manipulation, localStorage tampering, or DevTools
- [ ] Performance: Firestore read/write adds <100ms latency per message
- [ ] No new TypeScript errors

---

## Key Files to Create

```
src/
├── components/
│   └── auth/
│       └── SignupCta.tsx                    # Sign-up prompt component
└── durable-objects/
    └── chat-room.ts                         # Modify: add validation logic

agent/
└── tasks/
    └── milestone-14-anonymous-message-limit/
        ├── task-51-signupcta-component.md
        ├── task-52-client-side-count-logic.md
        ├── task-53-chat-route-integration.md
        ├── task-54-client-error-handling.md
        ├── task-55-firestore-stats-schema.md
        ├── task-56-anonymous-detection.md
        ├── task-57-message-count-validation.md
        ├── task-58-count-increment-logic.md
        └── task-59-integration-testing.md
```

---

## Key Files to Modify

```
src/
├── routes/
│   └── chat/
│       └── $conversationId.tsx              # Add count logic + SignupCta render
└── durable-objects/
    └── chat-room.ts                         # Add validation + increment logic
```

---

## Tasks

1. [Task 51: Create SignupCta Component](../tasks/milestone-14-anonymous-message-limit/task-51-signupcta-component.md)
2. [Task 52: Add Client-Side Message Count Logic](../tasks/milestone-14-anonymous-message-limit/task-52-client-side-count-logic.md)
3. [Task 53: Integrate SignupCta into Chat Route](../tasks/milestone-14-anonymous-message-limit/task-53-chat-route-integration.md)
4. [Task 54: Client-Side Error Handling for Limit](../tasks/milestone-14-anonymous-message-limit/task-54-client-error-handling.md)
5. [Task 55: Firestore Stats Schema & Helper Methods](../tasks/milestone-14-anonymous-message-limit/task-55-firestore-stats-schema.md)
6. [Task 56: ChatRoom DO Anonymous Detection](../tasks/milestone-14-anonymous-message-limit/task-56-anonymous-detection.md)
7. [Task 57: ChatRoom DO Message Count Validation](../tasks/milestone-14-anonymous-message-limit/task-57-message-count-validation.md)
8. [Task 58: ChatRoom DO Count Increment Logic](../tasks/milestone-14-anonymous-message-limit/task-58-count-increment-logic.md)
9. [Task 59: Integration Testing & Bypass Prevention](../tasks/milestone-14-anonymous-message-limit/task-59-integration-testing.md)

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Firestore read/write adds latency | Medium | High | Cache `isAnonymous` flag in DO session state; async increment |
| Client/server count drift | Low | Medium | Treat server as source of truth; force sync on error |
| Count contention on rapid sends | Low | Low | Use atomic increment; separate `stats` sub-document |
| Cross-app count confusion | Low | Medium | Document as intended behavior (unified limit) |
| Anonymous UID reuse after upgrade | Medium | Low | Design decision: count carries forward (incentivizes sign-up) |

---

## Dependencies

- Existing `isAnonymous` flag in session.ts (line 33-35)
- Existing `/auth?mode=signup&redirect_url=` auth flow
- `@prmichaelsen/firebase-admin-sdk-v8` for Firestore operations
- agentbase.me pattern reference (audit-22)

---

## Deployment Strategy

**Phase 1 (Soft Launch)**:
- Deploy client-side gating to production
- Monitor conversion funnel metrics (10 messages → sign-up rate)
- Collect user feedback on sign-up prompts
- Measure baseline performance (no server-side latency yet)

**Phase 2 (Hardening)**:
- Deploy server-side validation to staging
- Test bypass scenarios (WebSocket manipulation, localStorage tampering)
- Verify Firestore atomic increments under load
- Deploy to production with monitoring
- Track latency impact (target: <100ms per message)

**Rollback Plan**:
- Remove server-side validation if latency unacceptable
- Keep client-side gating as soft limit
- Cache counts in DO state (non-durable) if Firestore writes fail

---

**Next Milestone**: TBD
**Blockers**: None
**Related Design**: [agent/design/local.anonymous-message-limit.md](../design/local.anonymous-message-limit.md)
**Related Audit**: [agent/reports/audit-22-agentbase-anon-message-limit.md](../reports/audit-22-agentbase-anon-message-limit.md)
