# Task 14: Ghost Tab

**Milestone**: [M3 - Memory Integration](../../milestones/milestone-3-memory-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 13 (MCP Tools)
**Status**: Not Started

---

## Objective

Implement the Ghost tab for AI persona conversations, ported from agentbase.me's GhostChatView pattern with trust-tier filtered memory access.

---

## Steps

### 1. Ghost Tab Route
- Add `/ghost` route
- Tab navigation: Chat | Memories | Ghost
- Ghost tab icon and active state via ThemingProvider

### 2. Ghost Conversation UI
- Chat interface for AI persona conversations
- Messages themed with `messageAgent` styling
- Streaming response support (typing indicator + progressive rendering)
- Ghost conversation stored at `users/{userId}/conversations/{ghostConversationId}`

### 3. Trust-Tier Memory Access
- Ghost sees user memories filtered by trust configuration
- Reuse GhostConfigService from agentbase.me (via shared Firestore)
- `default_friend_trust`, `default_public_trust`, per-user overrides

### 4. Ghost Selection
- List available ghosts (user ghosts, group ghosts)
- Ghost availability check via `/api/ghost/availability`
- Select ghost to start/resume conversation

---

## Verification

- [ ] Ghost tab renders conversation interface
- [ ] AI responses stream progressively
- [ ] Ghost accesses memories filtered by trust tier
- [ ] Ghost conversations persist across sessions
- [ ] Multiple ghost personas can be selected

---

**Next Task**: [Task 15: Notification Engine & UI](../milestone-4-notifications-polish/task-15-notification-engine.md)
