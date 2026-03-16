# Task 44: Message Integration

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: [ActionBarItem Pattern](../../patterns/tanstack-cloudflare.action-bar-item.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 39, Task 40, Task 41, Task 42, Task 43
**Status**: Not Started

---

## Objective

Wire the ActionBar into Message.tsx, replacing the old hover-reveal action bar with an always-visible bottom action bar. Connect all action hooks and overflow menu to the conversation view.

---

## Context

This is the final integration task. All infrastructure (ActionBar, Popover, ConfirmRenderer), action hooks (Copy, Reply, Edit, SaveMemory, React, Delete, Forward, Pin, Report), overflow menu, and toast system are implemented. This task removes the old hover bar, adds the new ActionBar at the bottom of each message, and wires up the callbacks in ConversationView.

---

## Steps

### 1. Remove old hover action bar from Message.tsx

- Remove the entire `{/* Actions */}` div (the `absolute right-0 top-0` overlay with inline SVG buttons, approximately lines 116-171)
- Remove `showActions` state and related `onMouseEnter`/`onMouseLeave` handlers on the message container
- Remove the `group` class from the message container (no longer needed for hover reveal)
- Remove inline SVG imports if any remain
- Keep all existing props (`onCopy`, `onEdit`, `onDelete`, `onRegenerate`) for backward compatibility during transition, but they will be replaced by ActionBar callbacks

### 2. Add ActionBar to Message.tsx

- Import `ActionBar` from `@/components/action-bar/ActionBar`
- Import `useMessageActionBarItems` and `useMessageOverflowItems` hooks
- After message content (and after ReactionDisplay if present), render:

```tsx
<ActionBar
  items={[...primaryItems, overflowItem]}
  layout="compact"
/>
```

- The ActionBar is always visible (no hover gating)
- Uses compact layout for minimal visual footprint

### 3. Update Message component props

Replace the individual callback props with a unified interface:

```typescript
interface MessageProps {
  message: Message
  conversationId: string
  currentUserId: string
  canModerate?: boolean
  onReply?: (messageId: string, quotedContent: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onTogglePin?: (messageId: string) => void
  onReport?: (messageId: string) => void
}
```

### 4. Wire callbacks in ConversationView

In `src/routes/chat/$conversationId.tsx`:

- Pass `onReply` callback that populates compose input with quoted content
- Pass `onEdit` callback (existing or new inline edit handler)
- Pass `onDelete` callback that removes message from state and calls API
- Pass `onTogglePin` callback
- Pass `onReport` callback
- Pass `currentUserId` and `canModerate` from existing permission state

### 5. Update MessageList to pass new props

- `MessageList` must forward the new callback props to each `Message` component
- Add `conversationId`, `currentUserId`, and callback props to `MessageList` interface

### 6. Clean up unused code

- Remove `onCopy`, `onRegenerate` props if no longer used anywhere
- Remove any unused state in Message.tsx (e.g., `hoveredAction`)
- Remove inline SVG icon code (should already be gone from Task 38)

---

## Verification

- [ ] Old hover action bar is completely removed from Message.tsx
- [ ] ActionBar renders below every message (user, assistant, system)
- [ ] ActionBar is always visible — no hover or tap required
- [ ] Copy action copies text and shows "Copied to clipboard" toast
- [ ] Reply action populates compose input with quoted content
- [ ] Edit action is only visible on user's own messages
- [ ] Save to memory opens SaveMemoryModal
- [ ] React emoji button opens picker, selected emoji persists
- [ ] Overflow menu (⋮) opens with Delete, Forward, Pin, Report
- [ ] Delete shows confirmation popover, only available for own messages or moderators
- [ ] No orphaned props or unused imports
- [ ] ActionBar styling uses `useTheme()` consistently
- [ ] Works correctly on mobile (always visible, no hover dependency)
- [ ] No TypeScript errors
- [ ] No visual regression in message layout (spacing, alignment)

---

## Expected Output

**Files Modified**:
- `src/components/chat/Message.tsx` — remove old hover bar, add ActionBar
- `src/components/chat/MessageList.tsx` — forward new props
- `src/routes/chat/$conversationId.tsx` — wire callbacks

---

## Key Design Decisions

### Integration

| Decision | Choice | Rationale |
|---|---|---|
| Replace vs augment | Full replacement | User specified "replace" in clarification |
| Visibility | Always visible | User specified "always" on desktop and mobile |
| Layout | Compact | Minimize visual footprint below messages |
| Action grouping | Primary + overflow | Keep bar clean; less-common actions in ⋮ menu |

---

**Related**: [clarification-2-message-action-bar.md](../../clarifications/clarification-2-message-action-bar.md)
