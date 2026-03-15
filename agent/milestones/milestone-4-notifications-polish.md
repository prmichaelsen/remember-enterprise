# Milestone 4: Notifications & Polish

**Goal**: Add in-app and push notification system plus navigation shell polish for MVP launch
**Duration**: 1 week
**Dependencies**: M2 (Core Messaging), M3 (Memory Integration)
**Status**: Not Started

---

## Overview

This milestone completes the MVP by adding the notification system (in-app real-time + FCM push) and polishing the navigation shell (sidebar, tabs, mobile layout). These are the final P0 features needed before the product is usable as a daily driver.

---

## Deliverables

### 1. In-App Notifications
- Notification engine (WebSocket-based real-time delivery)
- NotificationBell component in header with unread badge
- Notification dropdown panel with mark-as-read
- Notification triggers: new DM, group mention, @agent response

### 2. Push Notifications
- FCM (Firebase Cloud Messaging) integration
- Service worker for background push
- Permission request flow
- Notification click → navigate to conversation

### 3. Navigation Shell
- Responsive sidebar (collapsible on mobile)
- Tab navigation (Chat, Memories, Ghost)
- Mobile bottom nav bar
- UnifiedHeader with user avatar, notification bell, theme toggle

---

## Success Criteria

- [ ] New message triggers in-app notification with unread badge
- [ ] Push notification appears when app is backgrounded
- [ ] Clicking notification navigates to correct conversation
- [ ] Sidebar collapses on mobile with hamburger toggle
- [ ] Tab navigation switches between Chat, Memories, Ghost views
- [ ] Theme toggle switches dark/light mode

---

## Tasks

1. [Task 15: Notification Engine & UI](../tasks/milestone-4-notifications-polish/task-15-notification-engine.md) - In-app real-time notifications
2. [Task 16: Push Notifications](../tasks/milestone-4-notifications-polish/task-16-push-notifications.md) - FCM integration
3. [Task 17: Navigation Shell](../tasks/milestone-4-notifications-polish/task-17-navigation-shell.md) - Sidebar, tabs, mobile layout

---

**Next Milestone**: None (MVP complete — P1 features follow)
**Blockers**: None
