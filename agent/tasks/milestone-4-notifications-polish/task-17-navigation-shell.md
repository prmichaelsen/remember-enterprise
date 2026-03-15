# Task 17: Navigation Shell

**Milestone**: [M4 - Notifications & Polish](../../milestones/milestone-4-notifications-polish.md)
**Design Reference**: [Color System](../../design/local.color-system.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 6 (Sidebar), Task 15 (Notifications)
**Status**: Not Started

---

## Objective

Polish the navigation shell with responsive sidebar, tab navigation, mobile bottom nav, and UnifiedHeader with user controls.

---

## Steps

### 1. UnifiedHeader
- Fixed header at top of page
- Left: hamburger (mobile) / logo
- Center: current conversation name or tab title
- Right: theme toggle, notification bell, user avatar dropdown

### 2. Tab Navigation
- Three tabs: Chat, Memories, Ghost
- Desktop: tabs in sidebar or header
- Active tab highlighted via ThemingProvider `active` class
- Route-driven tab state

### 3. Mobile Bottom Nav
- Bottom navigation bar on mobile (< 768px)
- Tab icons: MessageSquare, Brain, Ghost
- Active indicator
- Hides when keyboard is open

### 4. Responsive Sidebar
- Desktop: always visible (240px width)
- Tablet: collapsible with toggle
- Mobile: slide-over overlay with backdrop
- Transition animations

### 5. Theme Toggle
- Dark/light mode toggle in header
- Persists preference to localStorage
- Updates `ThemingProvider` theme prop

---

## Verification

- [ ] Header renders with all controls
- [ ] Tab navigation switches between Chat/Memories/Ghost
- [ ] Mobile bottom nav shows on small screens
- [ ] Sidebar collapses on mobile
- [ ] Theme toggle switches dark/light
- [ ] Theme preference persists across sessions

---

**Next Task**: None (MVP complete)
**Related Design Docs**: [Color System](../../design/local.color-system.md), [Requirements](../../design/local.requirements.md)
