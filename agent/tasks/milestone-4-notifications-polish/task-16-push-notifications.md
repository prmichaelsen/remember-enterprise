# Task 16: Push Notifications

**Milestone**: [M4 - Notifications & Polish](../../milestones/milestone-4-notifications-polish.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 15 (Notification Engine)
**Status**: Not Started

---

## Objective

Integrate Firebase Cloud Messaging (FCM) for push notifications when the app is backgrounded or closed.

---

## Steps

### 1. Service Worker
- Register FCM service worker
- Handle background push events
- Show native notification with title, body, icon

### 2. Permission Flow
- Prompt user for notification permission on first login
- Store FCM token in Firestore per user/device
- Handle permission denied gracefully

### 3. Server-Side Push
- On notification trigger (Task 15), also send FCM push
- Use Firebase Admin SDK to send to user's FCM tokens
- Payload: title, body, conversation_id, click_action URL

### 4. Notification Click
- Click native notification → open app at correct conversation
- If app already open → focus tab and navigate
- Handle deep linking for conversation URLs

---

## Verification

- [ ] Push notification appears when app is backgrounded
- [ ] Push notification appears when app is closed
- [ ] Clicking push navigates to correct conversation
- [ ] Permission request shows on first login
- [ ] Denied permission doesn't break app

---

**Next Task**: [Task 17: Navigation Shell](task-17-navigation-shell.md)
