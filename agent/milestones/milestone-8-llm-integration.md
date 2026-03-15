# Milestone 8: LLM Integration

**Goal**: Wire Anthropic Claude into Ghost tab via a ChatEngine ported from agentbase.me, enabling memory-augmented AI conversations
**Duration**: 1 week
**Dependencies**: M6 (Wire remember-core), M7 (Memory Routes & Bug Fixes)
**Status**: Not Started

---

## Overview

The Ghost tab UI, data model, and Firestore persistence are built (M3/M6), but no LLM is wired in — ghost responses are stubs. This milestone ports agentbase.me's ChatEngine pattern (provider-agnostic orchestration with dependency injection) into remember-enterprise, creating a simplified version focused on ghost conversations with memory-augmented prompts.

**Reference implementation**: `~/.acp/projects/agentbase.me/src/lib/chat/chat-engine.ts`

---

## Deliverables

### 1. ChatEngine + Anthropic Provider
- Install `@anthropic-ai/sdk`
- Create simplified `ChatEngine` class with `IAIProvider` interface
- Create `AnthropicAIProvider` implementing streaming chat
- Wire `ANTHROPIC_API_KEY` as Cloudflare secret

### 2. Ghost Streaming Endpoint
- SSE endpoint at `/api/ghosts/conversations/$conversationId/messages/stream`
- Streams text chunks as `data: {"chunk":"..."}` events
- Persists user message + assistant response to Firestore
- Handles abort/cancellation

### 3. Memory-Augmented System Prompts
- Ghost persona `systemPromptFragment` injected as system prompt
- Memory context (from SvcClient search) injected into prompt
- Trust tier filtering on memory retrieval
- Conversation history loaded from Firestore and passed to LLM

---

## Success Criteria

- [ ] Ghost tab produces real AI responses (not stubs)
- [ ] Responses stream progressively in the UI
- [ ] Memory context influences ghost responses (user can reference saved memories)
- [ ] Ghost persona system prompt shapes response personality
- [ ] `ANTHROPIC_API_KEY` managed as Cloudflare secret (not in code)
- [ ] Build passes

---

## Tasks

1. [Task 28: Install Anthropic SDK & Create ChatEngine](../tasks/milestone-8-llm-integration/task-28-chat-engine.md)
2. [Task 29: Ghost Streaming Endpoint](../tasks/milestone-8-llm-integration/task-29-ghost-streaming-endpoint.md)
3. [Task 30: Memory-Augmented System Prompts](../tasks/milestone-8-llm-integration/task-30-memory-augmented-prompts.md)

---

**Next Milestone**: TBD
**Blockers**: `ANTHROPIC_API_KEY` must be set as Cloudflare secret before deployment
