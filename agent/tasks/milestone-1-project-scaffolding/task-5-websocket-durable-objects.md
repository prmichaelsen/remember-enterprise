# Task 5: WebSocket Durable Objects

**Milestone**: [M1 - Project Scaffolding](../../milestones/milestone-1-project-scaffolding.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 2
**Status**: Not Started

---

## Objective

Set up Cloudflare Durable Objects for WebSocket connections with a client-side WebSocket Manager supporting auto-reconnect, exponential backoff, and page visibility recovery.

---

## Steps

### 1. Create Durable Object Class
- Implement WebSocket Durable Object following acp-tanstack-cloudflare pattern
- Handle `webSocketMessage`, `webSocketClose`, `webSocketError` events
- Track connected sessions per conversation
- Broadcast messages to all connected clients in a conversation

### 2. Configure Wrangler Bindings
- Add Durable Object binding in `wrangler.toml`
- Set up migration for Durable Object class

### 3. Create WebSocket API Route
- `/api/ws` endpoint that upgrades to WebSocket via Durable Object
- Auth validation before upgrade (verify session cookie)
- Route to correct Durable Object instance by conversation ID

### 4. Create Client WebSocket Manager
- `src/lib/websocket-manager.ts`
- Auto-reconnect with exponential backoff (1s, 2s, 4s... max 30s)
- Page visibility recovery (reconnect on tab refocus)
- Typed message protocol (discriminated union)
- `useWebSocket()` hook for components

### 5. End-to-End Test
- Send a message from one tab, verify it appears in another
- Disconnect network, verify reconnect on restore

---

## Verification

- [ ] WebSocket connects via Durable Object
- [ ] Messages broadcast to all participants in a conversation
- [ ] Auto-reconnect works after disconnect
- [ ] Page visibility recovery reconnects on tab refocus
- [ ] Unauthenticated WebSocket upgrades are rejected

---

**Next Task**: [Task 6: Conversation Sidebar & Navigation](../milestone-2-core-messaging/task-6-conversation-sidebar.md)
**Related Design Docs**: [Requirements](../../design/local.requirements.md)
