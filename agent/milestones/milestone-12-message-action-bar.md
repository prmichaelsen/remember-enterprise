# Milestone 12: Message Action Bar

**Goal**: Implement a composable, always-visible action bar at the bottom of every message using the ActionBarItem pattern
**Duration**: 1-2 weeks
**Dependencies**: None (all infrastructure milestones completed)
**Status**: Not Started

---

## Overview

Add an always-visible action bar below every chat message, replacing the current hover-reveal overlay. The bar provides quick actions (copy, reply, react, edit, save-to-memory) with an overflow menu for less-common actions (delete, forward, pin, report). Built on the ActionBarItem pattern spec — hook-per-action, reusable renderers, one-popover-at-a-time container — so the same actions can later be reused on memory cards, ghost messages, or any other surface.

This milestone also introduces the emoji reaction system (data model + inline picker), a toast notification system for action feedback, and migrates remaining inline SVGs to lucide-react.

---

## Deliverables

### 1. ActionBarItem Infrastructure
- `src/types/action-bar.ts` — ActionBarItem interface and ActionBarContentContext
- `src/components/action-bar/ActionBar.tsx` — Container with openKey orchestration, horizontal/vertical/compact layouts
- `src/components/action-bar/Popover.tsx` — Positioned popover anchored to trigger ref
- `src/components/action-bar/renderers/ConfirmRenderer.tsx` — Confirm/cancel with danger variant

### 2. Per-Action Hooks
- `useCopyActionBarItem` — copy message text, 1.5s toast
- `useReplyActionBarItem` — quote-reply (sets compose input)
- `useReactActionBarItem` — emoji picker popover
- `useEditActionBarItem` — inline edit (user messages only)
- `useSaveMemoryActionBarItem` — wraps existing SaveMemoryButton/Modal
- `useDeleteActionBarItem` — confirm popover, permission-gated
- `useForwardActionBarItem` — overflow, forward to another conversation
- `usePinActionBarItem` — overflow, pin/unpin toggle
- `useReportActionBarItem` — overflow, moderator action

### 3. Overflow Menu
- Overflow trigger (ellipsis icon) that opens a vertical ActionBar in a popover

### 4. Toast System
- Lightweight toast component with 1.5s auto-dismiss
- Context provider for `useToast()` hook

### 5. Emoji Reactions
- Firestore sub-collection or message metadata for reactions
- Inline reaction display below message content
- Emoji picker popover (compact grid)

### 6. Message Integration
- Replace existing hover action bar in Message.tsx with ActionBar
- Always visible on desktop and mobile
- Same action set for all message roles, permission-gated per user

---

## Success Criteria

- [ ] ActionBar renders below every message (user, assistant, system)
- [ ] Always visible on desktop and mobile (no hover required)
- [ ] Old hover overlay removed from Message.tsx
- [ ] Copy action copies message text and shows 1.5s toast
- [ ] Reply action populates compose input with quote
- [ ] React action opens emoji picker, reaction persists and displays inline
- [ ] Edit action works for user's own messages only
- [ ] Save to memory opens existing SaveMemoryModal
- [ ] Overflow menu contains Delete, Forward, Pin, Report
- [ ] Delete shows confirmation popover, respects permissions (can't delete others' messages)
- [ ] All icons use lucide-react (no inline SVGs in codebase)
- [ ] Theme-aware styling via `useTheme()`
- [ ] No new TypeScript errors

---

## Key Files to Create

```
src/
├── types/
│   └── action-bar.ts
├── components/
│   └── action-bar/
│       ├── ActionBar.tsx
│       ├── Popover.tsx
│       ├── OverflowMenu.tsx
│       └── renderers/
│           └── ConfirmRenderer.tsx
├── hooks/
│   └── action-bar/
│       ├── useCopyActionBarItem.ts
│       ├── useReplyActionBarItem.ts
│       ├── useReactActionBarItem.ts
│       ├── useEditActionBarItem.ts
│       ├── useSaveMemoryActionBarItem.ts
│       ├── useDeleteActionBarItem.ts
│       ├── useForwardActionBarItem.ts
│       ├── usePinActionBarItem.ts
│       └── useReportActionBarItem.ts
└── components/
    └── ui/
        ├── Toast.tsx
        └── ToastProvider.tsx
```

---

## Tasks

1. [Task 38: Migrate Inline SVGs to Lucide-React Icons](../tasks/unassigned/task-38-migrate-inline-svgs-to-lucide-react.md) — Replace remaining inline SVGs
2. [Task 39: ActionBarItem Infrastructure](../tasks/milestone-12-message-action-bar/task-39-action-bar-infrastructure.md) — Types, ActionBar container, Popover, ConfirmRenderer
3. [Task 40: Toast System](../tasks/milestone-12-message-action-bar/task-40-toast-system.md) — Toast component + ToastProvider + useToast hook
4. [Task 41: Core Action Hooks](../tasks/milestone-12-message-action-bar/task-41-core-action-hooks.md) — Copy, Reply, Edit, SaveMemory hooks
5. [Task 42: Emoji Reactions](../tasks/milestone-12-message-action-bar/task-42-emoji-reactions.md) — Reaction data model, picker, inline display, useReactActionBarItem
6. [Task 43: Overflow Menu & Remaining Hooks](../tasks/milestone-12-message-action-bar/task-43-overflow-menu-hooks.md) — OverflowMenu, Delete, Forward, Pin, Report hooks
7. [Task 44: Message Integration](../tasks/milestone-12-message-action-bar/task-44-message-integration.md) — Wire ActionBar into Message.tsx, remove old hover bar

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Emoji reactions add Firestore reads per message | Medium | Medium | Use message metadata field instead of sub-collection; batch reads |
| Popover positioning edge cases on mobile | Low | Medium | Use simple bottom-anchored positioning, test on iOS Safari |
| ActionBar adds visual clutter | Medium | Low | Keep icons small (w-4 h-4), muted colors, subtle styling |

---

**Next Milestone**: TBD
**Blockers**: None
**Notes**: Task 38 already exists in unassigned/; it will be adopted into this milestone
