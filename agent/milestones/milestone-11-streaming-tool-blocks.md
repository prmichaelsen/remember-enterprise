# Milestone 11: Streaming & Tool Blocks

**Goal**: Port agentbase.me's interleaved streaming blocks architecture, inline tool call badges, and markdown content rendering
**Duration**: 1 week
**Dependencies**: M8 (LLM Integration)
**Status**: Not Started

---

## Overview

Currently ghost/agent responses render as plain text. This milestone ports the streaming blocks pattern from agentbase.me where text chunks and tool call badges are interleaved inline during generation, and message content renders as formatted markdown with code blocks.

---

## Deliverables

### 1. Streaming Blocks Architecture
- `streamingBlocks` state in ChatInterface/ConversationView
- Interleaved `{type: 'text'}` and `{type: 'tool_use'}` blocks
- MessageList renders streaming blocks inline during generation

### 2. ToolCallBadge Component
- Inline badge showing tool name + status (pending/success/error)
- Animated spinner for pending state
- Wired to @agent MCP command results

### 3. MarkdownContent Component
- Code blocks with syntax highlighting
- Inline code, links, lists, bold/italic
- Themed via useTheme()

---

## Tasks

1. [Task 35: Streaming Blocks Architecture](../tasks/milestone-11-streaming-tool-blocks/task-35-streaming-blocks.md)
2. [Task 36: ToolCallBadge & Inline Tool Rendering](../tasks/milestone-11-streaming-tool-blocks/task-36-tool-call-badge.md)
3. [Task 37: MarkdownContent Component](../tasks/milestone-11-streaming-tool-blocks/task-37-markdown-content.md)

---

**Next Milestone**: M9 (Messaging API) / M10 (Groups & MCP API)
**Blockers**: None
