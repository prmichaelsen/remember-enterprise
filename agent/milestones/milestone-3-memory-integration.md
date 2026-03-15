# Milestone 3: Memory Integration

**Goal**: Connect chat to the memory platform — save messages as memories, browse memory feeds, and invoke MCP tools inline
**Duration**: 1-2 weeks
**Dependencies**: M2 (Core Messaging)
**Status**: Not Started

---

## Overview

This milestone transforms remember-enterprise from a plain chat app into a memory-powered collaboration tool. Users can save any message as a memory via a button CTA, browse a searchable memory feed with multiple algorithms, invoke MCP tools via `@agent` / `/agent` commands with inline results, and converse with AI personas in the Ghost tab.

---

## Deliverables

### 1. Save-as-Memory
- Button CTA on each chat message to create a memory
- Pre-fills memory content from message text
- Routes through `@prmichaelsen/remember-core` MemoryService

### 2. Memories Tab
- Searchable feed with algorithm selection (smart, chronological, discovery, rating, significance)
- MemoryCard rendering (simplified version of agentbase.me's MemoryCard)
- Filter by scope (personal, groups, spaces)

### 3. MCP Tool Invocation
- `@agent` and `/agent` command parsing in chat input
- MCP tool execution and result rendering inline as MessageCards
- Tool result persistence in conversation

### 4. Ghost Tab
- AI persona conversation interface
- Trust-tier filtered memory access
- Ghost conversation storage pattern from agentbase.me

---

## Success Criteria

- [ ] User can save a chat message as a memory with one click
- [ ] Memories tab shows feed with algorithm switching
- [ ] `@agent` command triggers MCP tool and renders result inline
- [ ] Ghost tab allows AI persona conversation
- [ ] Memory scopes (personal, group) filter correctly

---

## Tasks

1. [Task 11: Save-as-Memory CTA](../tasks/milestone-3-memory-integration/task-11-save-as-memory.md) - Button on messages to create memories
2. [Task 12: Memories Tab & Feed](../tasks/milestone-3-memory-integration/task-12-memories-tab.md) - Searchable feed with algorithm selection
3. [Task 13: MCP Tool Invocation](../tasks/milestone-3-memory-integration/task-13-mcp-tool-invocation.md) - @agent / /agent command handling
4. [Task 14: Ghost Tab](../tasks/milestone-3-memory-integration/task-14-ghost-tab.md) - AI persona conversations

---

**Next Milestone**: [Milestone 4: Notifications & Polish](milestone-4-notifications-polish.md)
**Blockers**: None
