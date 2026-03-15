# Milestone 2: Core Messaging

**Goal**: Implement DM and group chat with real-time message delivery, file uploads, and ACL-based permissions
**Duration**: 2-3 weeks
**Dependencies**: M1 (Project Scaffolding)
**Status**: Not Started

---

## Overview

This milestone builds the core Slack-like messaging experience: 1:1 DMs, private groups (which also serve as "group DMs"), real-time message delivery via WebSocket, file/image uploads, and ACL-gated access control reused from agentbase.me. By the end, users can chat in real-time with proper permissions.

---

## Deliverables

### 1. Conversation UI
- Channel/DM sidebar listing conversations
- Chat message list with sender info, timestamps
- Message compose input with send button
- Themed via ThemingProvider (messageSelf, messageOther, etc.)

### 2. DM & Group Support
- Create/open 1:1 DM conversations
- Create private groups (maps to agentbase.me group entities)
- Group member management (invite, remove)
- ACL enforcement (GroupAclService + MessageAclService reuse)

### 3. Real-Time Messaging
- Messages delivered via WebSocket Durable Objects
- Optimistic UI updates
- Message persistence to Firestore
- Scroll-to-bottom, new message indicators

### 4. File/Image Uploads
- Drag-and-drop or button upload in chat
- Signed-URL two-phase upload (per acp-tanstack-cloudflare pattern)
- Inline image preview in messages

---

## Success Criteria

- [ ] User can send and receive DMs in real-time
- [ ] User can create a private group and invite members
- [ ] Group ACL prevents unauthorized access
- [ ] Messages persist across page reloads
- [ ] Images upload and render inline in chat
- [ ] Message-level ACL works (e.g., @agent responses private to sender)

---

## Tasks

1. [Task 6: Conversation Sidebar & Navigation](../tasks/milestone-2-core-messaging/task-6-conversation-sidebar.md) - Channel/DM list UI
2. [Task 7: DM Conversations](../tasks/milestone-2-core-messaging/task-7-dm-conversations.md) - 1:1 messaging
3. [Task 8: Private Groups & ACL](../tasks/milestone-2-core-messaging/task-8-private-groups-acl.md) - Group creation, membership, permissions
4. [Task 9: Real-Time Message Delivery](../tasks/milestone-2-core-messaging/task-9-realtime-messages.md) - WebSocket message broadcast
5. [Task 10: File & Image Uploads](../tasks/milestone-2-core-messaging/task-10-file-uploads.md) - Upload flow with inline preview

---

**Next Milestone**: [Milestone 3: Memory Integration](milestone-3-memory-integration.md)
**Blockers**: None
