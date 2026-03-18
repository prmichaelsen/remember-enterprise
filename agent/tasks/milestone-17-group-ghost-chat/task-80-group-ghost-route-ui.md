# Task 80: Group Ghost Route UI

**Milestone**: M17 - Group Ghost Chat
**Status**: Not Started
**Estimated Hours**: 0.5
**Priority**: P1

---

## Objective

Add Ghost tab to `/groups/$groupId` route that renders the GhostChatView component with `ghostOwnerId="group:{groupId}"`, enabling users to chat with the group's collective knowledge ghost.

---

## Context

The group ghost UI follows the same pattern as space ghosts and conversation ghosts:
- Ghost tab appears alongside Chat and Memories tabs
- Clicking the tab loads a persistent ghost conversation
- The ghost persona is defined by the `ghostOwnerId` format: `group:{groupId}`

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md:245-247` (agentbase.me tab UI pattern)

The infrastructure is already in place:
- ✅ GhostChatView component exists
- ✅ ghostOwner parameter flow implemented in M15
- ✅ WebSocket and ChatRoom DO support `group:` prefix

What's missing:
- Ghost tab on group pages
- GROUP_GHOST_SEED message constant
- GhostChatView invocation with correct ghostOwnerId

---

## Steps

### 1. Verify Group Route Structure

Check if `/groups/$groupId` route exists:
- Read `src/routes/groups/$groupId.tsx` (or similar)
- Verify SubHeaderTabs component is used for Chat/Memories tabs
- Note the current tab state management pattern

If the route doesn't exist:
- Create minimal group page route
- Add SubHeaderTabs with Chat and Memories tabs
- Add activeTab state management

### 2. Define GROUP_GHOST_SEED Constant

Add constant near the top of the group route file:

```typescript
const GROUP_GHOST_SEED = `I am the ghost of this group — a knowledgeable agent that has access to all memories published to this group.

I can help you:
- Search memories shared by group members
- Answer questions based on collective knowledge
- Provide context from past conversations

Ask me anything about what's been shared in this group!`
```

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md:33,256` (seed message pattern)

### 3. Add Ghost Tab to SubHeaderTabs

Add ghost tab to the tabs array:

```typescript
const tabs = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare /> },
  { id: 'memories', label: 'Memories', icon: <BookMarked /> },
  { id: 'ghost', label: 'Ghost', icon: <Ghost />, variant: 'ghost' },
]
```

**Import**: Ensure `Ghost` icon is imported from lucide-react or local icons

### 4. Import GhostChatView Component

Add import at top of file:

```typescript
import { GhostChatView } from '~/components/chat/GhostChatView'
```

### 5. Render GhostChatView When Ghost Tab Active

Add conditional rendering inside the route's return block:

```typescript
{activeTab === 'ghost' && (
  <GhostChatView
    ghostOwnerId={`group:${groupId}`}
    seedMessage={GROUP_GHOST_SEED}
  />
)}
```

**Pattern**: Follows the same pattern as conversation ghost tabs (`agent/reports/audit-32-agentbase-group-ghost-ux.md:199-209`)

### 6. Test Ghost Tab UI

Verify:
- Ghost tab appears on group pages
- Clicking ghost tab switches to ghost view
- GhostChatView renders with loading state
- Ghost conversation initializes with seed message

---

## Verification Checklist

- [ ] GROUP_GHOST_SEED constant defined with appropriate message
- [ ] Ghost tab added to SubHeaderTabs array
- [ ] Ghost icon imported (from lucide-react or local)
- [ ] GhostChatView imported
- [ ] GhostChatView rendered conditionally when `activeTab === 'ghost'`
- [ ] `ghostOwnerId` prop set to `group:${groupId}` format
- [ ] `seedMessage` prop passed with GROUP_GHOST_SEED
- [ ] Ghost tab is visible on group pages
- [ ] Clicking ghost tab loads ghost conversation UI
- [ ] No console errors on tab switch

---

## Files Modified

- `src/routes/groups/$groupId.tsx` (or equivalent group route file)

---

## Dependencies

- **Blocked by**: None (GhostChatView component exists from M15)
- **Blocks**: Task 81 (system prompt needed for ghost to respond)

---

## Related Documents

- agent/reports/audit-32-agentbase-group-ghost-ux.md (agentbase.me UI patterns)
- agent/milestones/milestone-17-group-ghost-chat.md (parent milestone)
- src/components/chat/GhostChatView.tsx (component to render)

---

## Notes

- Ghost tab should always be visible (no availability check like user ghosts)
- GhostChatView handles conversation creation automatically via `getOrCreateGhostConversation()`
- The ghost won't respond intelligently until Task 81 (system prompt) is complete
- agentbase.me uses `variant: 'ghost'` for styling the ghost tab (optional aesthetic enhancement)

---

**Created**: 2026-03-18
**Estimated Hours**: 0.5 (30 minutes)
