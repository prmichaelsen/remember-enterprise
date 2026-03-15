# Task 11: Save-as-Memory CTA

**Milestone**: [M3 - Memory Integration](../../milestones/milestone-3-memory-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 7 (DM Conversations)
**Status**: Not Started

---

## Objective

Add a "Save as Memory" button CTA on each chat message that creates a memory via `@prmichaelsen/remember-core` MemoryService.

---

## Steps

### 1. Message Action Button
- Add bookmark/save icon button on each message (hover reveal)
- Button uses `useTheme()` buttonGhost styling
- Tooltip: "Save as Memory"

### 2. Save Flow
- On click: open lightweight modal/popover
- Pre-fill memory content from message text
- Optional: add title, tags
- Submit calls `remember-core` SvcClient to create memory
- Success toast confirmation

### 3. Memory Scope Selection
- Default: personal memory
- Option to publish to group (if message is in a group)
- Scope selector in save modal

### 4. Visual Feedback
- Messages already saved show filled bookmark icon
- Prevent duplicate saves (check if memory already exists for message)

---

## Verification

- [ ] Save button appears on hover for each message
- [ ] Clicking save creates a memory via remember-core
- [ ] Memory content matches message text
- [ ] Saved messages show filled bookmark indicator
- [ ] Duplicate save prevention works

---

**Next Task**: [Task 12: Memories Tab & Feed](task-12-memories-tab.md)
