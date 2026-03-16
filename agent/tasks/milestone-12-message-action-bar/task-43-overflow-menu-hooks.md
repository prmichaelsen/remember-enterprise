# Task 43: Overflow Menu & Remaining Hooks

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: [ActionBarItem Pattern](../../patterns/tanstack-cloudflare.action-bar-item.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 39 (ActionBar infrastructure), Task 40 (Toast system)
**Status**: Not Started

---

## Objective

Create the overflow menu component and the secondary action hooks (Delete, Forward, Pin, Report) that live inside it.

---

## Context

Per clarification-2, Delete, Forward, Pin, and Report are overflow actions — they appear in a "more options" menu rather than directly in the action bar. The overflow menu itself is an ActionBarItem with an ellipsis icon whose `renderContent` renders a vertical ActionBar of the overflow items.

---

## Steps

### 1. Create useDeleteActionBarItem

**File**: `src/hooks/action-bar/useDeleteActionBarItem.ts`

- Icon: `Trash2` from lucide-react
- `renderContent`: ConfirmRenderer with `variant: 'danger'`
- Confirm text: "Delete this message?"
- On confirm: calls message delete API, closes popover
- `danger: true` for red styling
- Permission-gated: `hidden: true` if user is not the sender and doesn't have `can_moderate` permission

```typescript
function useDeleteActionBarItem(
  messageId: string,
  conversationId: string,
  isSender: boolean,
  canModerate: boolean,
  onDelete: (messageId: string) => void,
): ActionBarItem
```

### 2. Create useForwardActionBarItem

**File**: `src/hooks/action-bar/useForwardActionBarItem.ts`

- Icon: `Forward` from lucide-react
- Direct action: opens a conversation picker modal (renderModals)
- On select: copies message content to new conversation
- Shows 1.5s toast: "Message forwarded"

```typescript
function useForwardActionBarItem(
  content: string,
): ActionBarItem
```

### 3. Create usePinActionBarItem

**File**: `src/hooks/action-bar/usePinActionBarItem.ts`

- Icon: `Pin` from lucide-react (active: `PinOff`)
- Direct action: toggles pin status on message
- Shows 1.5s toast: "Message pinned" / "Message unpinned"
- `active: true` when message is currently pinned

```typescript
function usePinActionBarItem(
  messageId: string,
  conversationId: string,
  isPinned: boolean,
  onTogglePin: (messageId: string) => void,
): ActionBarItem
```

### 4. Create useReportActionBarItem

**File**: `src/hooks/action-bar/useReportActionBarItem.ts`

- Icon: `Flag` from lucide-react
- `renderContent`: simple confirmation "Report this message to moderators?"
- On confirm: calls report API
- Shows 1.5s toast: "Message reported"
- Hidden for user's own messages

```typescript
function useReportActionBarItem(
  messageId: string,
  isSender: boolean,
  onReport: (messageId: string) => void,
): ActionBarItem
```

### 5. Create OverflowMenu component

**File**: `src/components/action-bar/OverflowMenu.tsx`

- An `ActionBarItem` factory that takes an array of overflow items
- Icon: `EllipsisVertical` from lucide-react
- `renderContent`: renders a vertical `<ActionBar items={overflowItems} layout="vertical" />`
- The nested ActionBar manages its own `openKey` for sub-popovers (e.g., delete confirmation)

```typescript
function useOverflowActionBarItem(
  items: ActionBarItem[],
): ActionBarItem
```

### 6. Create useMessageOverflowItems convenience hook

**File**: `src/hooks/action-bar/useMessageOverflowItems.ts`

Composes overflow items for a message:

```typescript
function useMessageOverflowItems(opts: {
  message: Message
  conversationId: string
  currentUserId: string
  canModerate: boolean
  onDelete: (messageId: string) => void
  onTogglePin: (messageId: string) => void
  onReport: (messageId: string) => void
}): ActionBarItem  // Returns the overflow ActionBarItem
```

---

## Verification

- [ ] Delete shows ConfirmRenderer popover with "Delete this message?"
- [ ] Delete is hidden when user is not sender and not moderator
- [ ] Delete confirm calls onDelete and closes popover
- [ ] Forward opens conversation picker modal
- [ ] Pin toggles pin state and shows toast
- [ ] Pin icon changes between Pin/PinOff based on state
- [ ] Report is hidden for user's own messages
- [ ] Report shows confirmation, calls onReport
- [ ] OverflowMenu renders ellipsis icon that opens a vertical menu
- [ ] Overflow menu items function correctly within the nested ActionBar
- [ ] All hooks create their own triggerRef
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/hooks/action-bar/useDeleteActionBarItem.ts`
- `src/hooks/action-bar/useForwardActionBarItem.ts`
- `src/hooks/action-bar/usePinActionBarItem.ts`
- `src/hooks/action-bar/useReportActionBarItem.ts`
- `src/components/action-bar/OverflowMenu.tsx`
- `src/hooks/action-bar/useMessageOverflowItems.ts`

---

**Next Task**: [Task 44: Message Integration](task-44-message-integration.md)
