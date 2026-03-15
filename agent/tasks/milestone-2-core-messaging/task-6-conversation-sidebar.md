# Task 6: Conversation Sidebar & Navigation

**Milestone**: [M2 - Core Messaging](../../milestones/milestone-2-core-messaging.md)
**Design Reference**: [Color System](../../design/local.color-system.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 3 (ThemingProvider)
**Status**: Not Started

---

## Objective

Build the channel/DM sidebar listing all user conversations, with new conversation creation and unread indicators.

---

## Steps

### 1. Conversation List Component
- Fetch user's conversations from Firestore (DMs + groups)
- Render list with avatar, name, last message preview, timestamp
- Unread message count badge
- Use `useTheme()` for all styling (sidebar, hover, badgeInfo)

### 2. New Conversation Actions
- "New DM" button → user search/select
- "New Group" button → group creation flow
- Compose button in sidebar header

### 3. Active Conversation Highlight
- Selected conversation gets `active` theme class
- URL-driven selection via TanStack Router params

### 4. Responsive Behavior
- Full sidebar on desktop
- Collapsible with hamburger on mobile (slides in/out)

---

## Verification

- [ ] Sidebar lists all user conversations
- [ ] Clicking a conversation navigates to it
- [ ] Active conversation is visually highlighted
- [ ] Unread badge shows correct count
- [ ] Sidebar collapses on mobile

---

**Next Task**: [Task 7: DM Conversations](task-7-dm-conversations.md)
