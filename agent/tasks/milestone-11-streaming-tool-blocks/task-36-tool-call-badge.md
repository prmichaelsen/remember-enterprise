# Task 36: ToolCallBadge & Inline Tool Rendering

**Milestone**: [M11 - Streaming & Tool Blocks](../../milestones/milestone-11-streaming-tool-blocks.md)
**Design Reference**: [Audit #3](../../reports/audit-3-chatinterface-messageinput.md)
**Estimated Time**: 1.5 hours
**Dependencies**: Task 35
**Status**: Not Started

---

## Objective

Create a ToolCallBadge component that renders inline during streaming to show tool name, status, and animated spinner. Wire to @agent MCP command results.

---

## Steps

### 1. Create ToolCallBadge component
- File: `src/components/chat/ToolCallBadge.tsx`
- Props: `{ name: string, status: 'pending' | 'success' | 'error', id?: string }`
- Styling via `useTheme()`:
  - Pending: `t.badgeInfo` with `Loader2` spinner (animate-spin)
  - Success: `t.badgeSuccess` with `Check` icon
  - Error: `t.badgeDanger` with `X` icon
- Inline display: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs`
- Tool name displayed as label (e.g., "remember_search", "remember_create_memory")

### 2. Create StreamingBlockRenderer component
- File: `src/components/chat/StreamingBlockRenderer.tsx`
- Accepts `blocks: StreamingBlock[]`
- Maps over blocks:
  - `type: 'text'` → MarkdownContent (or plain text until Task 37)
  - `type: 'tool_use'` → ToolCallBadge
- Renders inline with blinking cursor at end (during active streaming)

### 3. Wire to @agent command flow
- When MCP tool invocation starts: emit `tool_call_start` via WebSocket
- When tool completes: emit `tool_call_complete` with result status
- Ghost streaming endpoint (Task 29) should emit these events when ChatEngine processes tool calls (future — for now, just render the components)

---

## Verification

- [ ] ToolCallBadge renders with correct status styling
- [ ] Pending state shows animated spinner
- [ ] Success/error states show appropriate icons
- [ ] StreamingBlockRenderer interleaves text and badges
- [ ] Blinking cursor shows during active streaming
- [ ] Components use useTheme() (no raw Tailwind colors)
- [ ] Build passes

---

**Next Task**: [Task 37: MarkdownContent](task-37-markdown-content.md)
