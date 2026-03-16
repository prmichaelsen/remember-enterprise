# Task 41: Core Action Hooks

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: [ActionBarItem Pattern](../../patterns/tanstack-cloudflare.action-bar-item.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 39 (ActionBar infrastructure), Task 40 (Toast system)
**Status**: Not Started

---

## Objective

Implement the four primary action hooks that appear directly in the message action bar: Copy, Reply, Edit, and Save to Memory.

---

## Context

These are the always-visible actions in the message action bar. Each hook returns an `ActionBarItem` following the pattern spec. They use `onTrigger` for direct actions (Copy) or `renderContent` for popover-based interactions (Edit confirmation, etc.).

---

## Steps

### 1. Create useCopyActionBarItem

**File**: `src/hooks/action-bar/useCopyActionBarItem.ts`

- Icon: `Copy` from lucide-react
- Direct action (no popover): `onTrigger` copies message text to clipboard via `navigator.clipboard.writeText()`
- Shows 1.5s success toast: "Copied to clipboard"
- Accepts `content: string` (the message text to copy)

```typescript
function useCopyActionBarItem(content: string): ActionBarItem
```

### 2. Create useReplyActionBarItem

**File**: `src/hooks/action-bar/useReplyActionBarItem.ts`

- Icon: `Reply` from lucide-react
- Direct action: calls an `onReply` callback with the message ID and content
- The parent (ConversationView) handles populating the compose input with a quote
- Shows no toast (reply action is its own feedback — compose input updates)

```typescript
function useReplyActionBarItem(
  messageId: string,
  content: string,
  onReply: (messageId: string, quotedContent: string) => void,
): ActionBarItem
```

### 3. Create useEditActionBarItem

**File**: `src/hooks/action-bar/useEditActionBarItem.ts`

- Icon: `Pencil` from lucide-react
- Direct action: calls `onEdit` callback with message ID
- Hidden when user is not the message sender (`hidden: true`)
- The parent handles inline edit mode

```typescript
function useEditActionBarItem(
  messageId: string,
  isSender: boolean,
  onEdit: (messageId: string) => void,
): ActionBarItem
```

### 4. Create useSaveMemoryActionBarItem

**File**: `src/hooks/action-bar/useSaveMemoryActionBarItem.ts`

- Icon: `BookmarkPlus` from lucide-react
- Has `renderModals` that renders the existing `SaveMemoryModal`
- `onTrigger` opens the modal (manages local `isOpen` state)
- Shows 1.5s toast on successful save: "Saved to memory"
- Accepts message content and conversation context

```typescript
function useSaveMemoryActionBarItem(
  content: string,
  conversationId: string,
): ActionBarItem
```

### 5. Wire hooks together in a convenience composer

**File**: `src/hooks/action-bar/useMessageActionBarItems.ts`

Convenience hook that composes all primary action items for a message:

```typescript
function useMessageActionBarItems(opts: {
  message: Message
  currentUserId: string
  conversationId: string
  onReply: (messageId: string, quotedContent: string) => void
  onEdit: (messageId: string) => void
}): ActionBarItem[]
```

Returns `[copyItem, replyItem, editItem, saveMemoryItem]` (filtered by visibility).

---

## Verification

- [ ] `useCopyActionBarItem` copies text to clipboard and shows "Copied to clipboard" toast
- [ ] `useReplyActionBarItem` calls onReply callback with message ID and content
- [ ] `useEditActionBarItem` is hidden for messages not sent by current user
- [ ] `useEditActionBarItem` calls onEdit callback for user's own messages
- [ ] `useSaveMemoryActionBarItem` opens SaveMemoryModal when triggered
- [ ] `useMessageActionBarItems` returns the correct set of items for a given message
- [ ] All hooks create their own `triggerRef`
- [ ] All hooks return valid `ActionBarItem` objects
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/hooks/action-bar/useCopyActionBarItem.ts`
- `src/hooks/action-bar/useReplyActionBarItem.ts`
- `src/hooks/action-bar/useEditActionBarItem.ts`
- `src/hooks/action-bar/useSaveMemoryActionBarItem.ts`
- `src/hooks/action-bar/useMessageActionBarItems.ts`

---

**Next Task**: [Task 42: Emoji Reactions](task-42-emoji-reactions.md)
