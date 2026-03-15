# Task 9: Real-Time Message Delivery

**Milestone**: [M2 - Core Messaging](../../milestones/milestone-2-core-messaging.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 5 (WebSocket), Task 7 (DM)
**Status**: Not Started

---

## Objective

Wire up WebSocket message delivery for real-time chat across DMs and groups — message broadcast, typing indicators, and new message notifications in sidebar.

---

## Steps

### 1. Message Broadcast
- On message send: persist to Firestore, then broadcast via Durable Object
- Durable Object routes message to all connected clients in conversation
- Client receives and appends message to chat list

### 2. Typing Indicators
- Send typing start/stop events via WebSocket
- Display "User is typing..." indicator below message list
- Debounce typing events (300ms)

### 3. Sidebar Updates
- Update last message preview in sidebar on new message
- Increment unread count for non-active conversations
- Reorder sidebar by most recent message

### 4. Multi-Tab Sync
- Multiple browser tabs showing same conversation stay in sync
- Unread counts sync across tabs

---

## Verification

- [ ] Messages appear instantly in recipient's chat
- [ ] Typing indicator shows when other user types
- [ ] Sidebar last message updates in real-time
- [ ] Unread count increments for background conversations
- [ ] Multiple tabs stay synchronized

---

**Next Task**: [Task 10: File & Image Uploads](task-10-file-uploads.md)
