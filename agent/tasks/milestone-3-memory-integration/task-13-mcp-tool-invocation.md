# Task 13: MCP Tool Invocation

**Milestone**: [M3 - Memory Integration](../../milestones/milestone-3-memory-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 7 (DM), Task 8 (Groups)
**Status**: Not Started

---

## Objective

Implement `@agent` and `/agent` command parsing in chat input with MCP tool execution and inline result rendering as simplified MessageCards.

---

## Steps

### 1. Command Parser
- Detect `@agent <command>` or `/agent <command>` in message input
- Extract tool name and arguments
- Prevent sending as plain message — route to MCP handler

### 2. MCP Tool Execution
- Server-side MCP tool invocation via ChatEngine pattern (acp-tanstack-cloudflare)
- Route to available MCP servers (remember-mcp tools available via shared DB)
- Stream response back via WebSocket

### 3. Inline Result Rendering
- Tool results render as `messageAgent` themed blocks
- Simplified MessageCard: title, content preview, action buttons
- Support for: text responses, memory cards, error states
- Message-level ACL: @agent responses private to sender (visible_to_user_ids: [senderId])

### 4. Command Autocomplete
- Mention suggestions when typing `@agent` or `/agent`
- List available tools with descriptions
- Tab to complete

---

## Verification

- [ ] `@agent` command triggers MCP tool execution
- [ ] `/agent` command triggers same behavior
- [ ] Tool results render inline with agent theme styling
- [ ] @agent responses are private to sender in group chats
- [ ] Autocomplete shows available tools
- [ ] Error states render gracefully

---

**Next Task**: [Task 14: Ghost Tab](task-14-ghost-tab.md)
