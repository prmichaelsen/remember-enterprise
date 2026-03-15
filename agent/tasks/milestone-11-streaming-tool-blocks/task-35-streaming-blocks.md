# Task 35: Streaming Blocks Architecture

**Milestone**: [M11 - Streaming & Tool Blocks](../../milestones/milestone-11-streaming-tool-blocks.md)
**Design Reference**: [Audit #3](../../reports/audit-3-chatinterface-messageinput.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 28 (ChatEngine)
**Status**: Not Started

---

## Objective

Port the interleaved streaming blocks pattern from agentbase.me's ChatInterface. Replace current simple text accumulation with a `streamingBlocks` array that supports both text and tool_use blocks rendered inline during generation.

---

## Context

agentbase.me's ChatInterface maintains:
```typescript
streamingBlocks: Array<
  | { type: 'text', text: string }
  | { type: 'tool_use', id: string, name: string, status: 'pending' | 'success' | 'error' }
>
```

During streaming:
- `chunk` events append to the last text block (or create a new one)
- `tool_call` events insert a tool_use block between text blocks
- `tool_result` events update the tool_use block's status
- MessageList renders all blocks inline, so tool badges appear between text paragraphs

---

## Steps

### 1. Define StreamingBlock types
- File: `src/types/streaming.ts`
- `TextBlock`, `ToolUseBlock`, `StreamingBlock` union type
- Export for use in MessageList and ConversationView

### 2. Add streamingBlocks state to ConversationView
- `src/routes/chat/$conversationId.tsx`
- `const [streamingBlocks, setStreamingBlocks] = useState<StreamingBlock[]>([])`
- Update WebSocket message handler:
  - `message_new` with `role: 'assistant'`: accumulate text into streamingBlocks
  - `agent_response_chunk`: append text to last text block or create new one
  - `tool_call_start`: insert tool_use block with status=pending
  - `tool_call_complete`: update tool_use block status to success/error
  - On stream complete: clear streamingBlocks, add final message to messages array

### 3. Update MessageList to render streamingBlocks
- Accept `streamingBlocks` prop
- Render after the last message in the list
- Each text block → MarkdownContent (Task 37)
- Each tool_use block → ToolCallBadge (Task 36)

### 4. Update ChatRoom DO protocol
- Ensure `agent_response_chunk`, `tool_call_start`, `tool_call_complete` message types are in the WebSocket protocol types
- Update `src/types/websocket.ts` if needed

---

## Verification

- [ ] streamingBlocks state tracks text + tool_use blocks
- [ ] Text chunks append to existing text block
- [ ] Tool calls insert between text blocks
- [ ] MessageList renders streaming blocks inline
- [ ] Blocks clear on stream complete
- [ ] Build passes

---

**Next Task**: [Task 36: ToolCallBadge](task-36-tool-call-badge.md)
