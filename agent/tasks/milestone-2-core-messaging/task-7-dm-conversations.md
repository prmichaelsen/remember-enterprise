# Task 7: DM Conversations

**Milestone**: [M2 - Core Messaging](../../milestones/milestone-2-core-messaging.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 5 (WebSocket), Task 6 (Sidebar)
**Status**: Not Started

---

## Objective

Implement 1:1 direct message conversations with real-time delivery, message persistence, and proper UI.

---

## Steps

### 1. DM Data Model
- Reuse agentbase.me conversation schema in Firestore
- Two-participant conversation with `type: 'dm'`
- Messages subcollection with sender, content, timestamps

### 2. Chat Message List
- Virtualized/scrollable message list
- Message bubbles with sender avatar, name, timestamp
- Themed: `messageSelf` for own messages, `messageOther` for received
- Auto-scroll to bottom on new messages

### 3. Message Compose
- Text input with send button (Enter to send)
- Optimistic UI: show message immediately, confirm on server ack
- Markdown support in message content

### 4. DM Creation Flow
- User search by name/email
- Create or resume existing DM with selected user
- Navigate to new conversation

---

## Verification

- [ ] User can create a DM with another user
- [ ] Messages send and receive in real-time
- [ ] Messages persist across page reloads
- [ ] Own messages styled differently from received
- [ ] Optimistic UI shows message before server confirmation

---

**Next Task**: [Task 8: Private Groups & ACL](task-8-private-groups-acl.md)
