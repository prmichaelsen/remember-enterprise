# Task 15: Notification Engine & UI

**Milestone**: [M4 - Notifications & Polish](../../milestones/milestone-4-notifications-polish.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 9 (Real-Time Messages)
**Status**: Not Started

---

## Objective

Implement in-app real-time notification engine with NotificationBell component, unread badge, and notification panel.

---

## Steps

### 1. Notification Engine
- WebSocket-based notification delivery (via Durable Objects)
- Notification triggers: new DM, group message, @agent response, @mention
- Notification persistence in Firestore (per-user notification collection)
- Notification schema: id, type, title, body, conversation_id, read, created_at

### 2. NotificationBell Component
- Bell icon in header with unread count badge
- Badge uses `notificationBadge` theme class
- Click toggles notification panel dropdown

### 3. Notification Panel
- Dropdown list of recent notifications
- Unread items use `notificationUnread` styling, read use `notificationRead`
- "Mark all as read" action
- Click notification → navigate to conversation

### 4. Real-Time Updates
- New notifications update badge count instantly
- Mark-as-read syncs across tabs

---

## Verification

- [ ] New message creates notification for recipient
- [ ] NotificationBell shows correct unread count
- [ ] Notification panel lists notifications
- [ ] Clicking notification navigates to conversation
- [ ] "Mark all as read" clears badge
- [ ] Real-time badge updates across tabs

---

**Next Task**: [Task 16: Push Notifications](task-16-push-notifications.md)
