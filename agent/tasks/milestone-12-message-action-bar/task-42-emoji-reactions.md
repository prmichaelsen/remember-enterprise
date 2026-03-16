# Task 42: Emoji Reactions

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: None
**Estimated Time**: 4-6 hours
**Dependencies**: Task 39 (ActionBar infrastructure)
**Status**: Not Started

---

## Objective

Implement emoji reactions on messages — data model, compact emoji picker popover, inline reaction display below messages, and the `useReactActionBarItem` hook.

---

## Context

Emoji reactions are a core chat feature. The user confirmed reactions should be available on all messages. This task covers the full vertical: Firestore storage, API route, picker UI, inline display, and ActionBarItem integration.

---

## Steps

### 1. Define reaction data model

Reactions stored as a map on the message document metadata to avoid extra Firestore reads:

```typescript
// In Message metadata
reactions?: {
  [emoji: string]: string[]  // emoji → array of user IDs who reacted
}
```

Example: `{ "👍": ["uid1", "uid2"], "❤️": ["uid1"] }`

Update the `Message` interface in `src/types/conversations.ts` to include `reactions` in metadata.

### 2. Create reaction API route

**File**: `src/routes/api/messages/$messageId.reactions.tsx`

- `POST` — toggle a reaction (add if not present, remove if already reacted)
- Body: `{ emoji: string }`
- Auth guard: must be logged in
- Uses `setDocument` with merge to update message metadata
- Returns updated reactions map

### 3. Create EmojiPicker component

**File**: `src/components/chat/EmojiPicker.tsx`

- Compact grid of common emojis (12-20 most popular: 👍 ❤️ 😂 😮 😢 😡 🎉 🔥 👀 🙏 ✅ ❌)
- Grid layout: `grid grid-cols-6 gap-1`
- Each emoji is a button, `text-lg p-1.5 rounded hover:bg-bg-elevated`
- Uses `useTheme()` for styling
- Props: `onSelect: (emoji: string) => void`
- No external emoji picker library needed — keep it simple

### 4. Create useReactActionBarItem hook

**File**: `src/hooks/action-bar/useReactActionBarItem.ts`

- Icon: `SmilePlus` from lucide-react
- `renderContent`: renders `EmojiPicker` inside popover
- On emoji select: calls reaction API, closes popover, shows 1.5s toast
- Accepts `messageId` and `conversationId`

```typescript
function useReactActionBarItem(
  messageId: string,
  conversationId: string,
): ActionBarItem
```

### 5. Create ReactionDisplay component

**File**: `src/components/chat/ReactionDisplay.tsx`

- Renders below message content, above the action bar
- Shows compact pills: `👍 2` `❤️ 1` — each pill is clickable to toggle your reaction
- If current user reacted, pill gets active/highlighted styling
- Props: `reactions: Record<string, string[]>`, `currentUserId: string`, `onToggle: (emoji: string) => void`
- Layout: `flex flex-wrap gap-1`
- Each pill: `px-2 py-0.5 rounded-full text-xs border` with theme-aware colors

### 6. Wire ReactionDisplay into Message component

- In `Message.tsx`, render `<ReactionDisplay>` between message content and the action bar
- Only render when `message.metadata?.reactions` has entries
- Wire `onToggle` to call the reaction API

---

## Verification

- [ ] `Message` type includes `reactions` in metadata
- [ ] POST `/api/messages/:messageId/reactions` toggles a reaction
- [ ] Reacting twice with the same emoji removes it
- [ ] EmojiPicker renders a compact grid of common emojis
- [ ] Clicking an emoji in the picker calls the API and closes the popover
- [ ] ReactionDisplay shows reaction pills with counts
- [ ] Clicking a reaction pill toggles the current user's reaction
- [ ] Active reaction pills (user has reacted) are visually highlighted
- [ ] Reactions persist across page reloads
- [ ] Real-time updates via WebSocket (if message events include metadata)
- [ ] Uses `useTheme()` — no hardcoded colors
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/components/chat/EmojiPicker.tsx`
- `src/components/chat/ReactionDisplay.tsx`
- `src/hooks/action-bar/useReactActionBarItem.ts`
- `src/routes/api/messages/$messageId.reactions.tsx`

**Files Modified**:
- `src/types/conversations.ts` — add `reactions` to Message metadata
- `src/components/chat/Message.tsx` — add ReactionDisplay

---

**Next Task**: [Task 43: Overflow Menu & Remaining Hooks](task-43-overflow-menu-hooks.md)
