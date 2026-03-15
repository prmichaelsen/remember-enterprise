# Task 28: Install Anthropic SDK & Create ChatEngine

**Milestone**: [M8 - LLM Integration](../../milestones/milestone-8-llm-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Install `@anthropic-ai/sdk` and create a simplified ChatEngine with AnthropicAIProvider, ported from agentbase.me's pattern. The engine should support streaming responses, tool execution (future), and be provider-agnostic via interfaces.

---

## Context

agentbase.me's ChatEngine (`~/.acp/projects/agentbase.me/src/lib/chat/chat-engine.ts`) uses dependency injection with 4 providers (AI, Storage, MCP, Vision). For remember-enterprise's initial implementation, we only need the AI provider — storage is handled by GhostDatabaseService, and MCP/Vision are future additions.

Key files to reference in agentbase.me:
- `src/lib/chat/chat-engine.ts` — orchestration layer
- `src/lib/chat-providers/anthropic-ai-provider.ts` — Anthropic streaming
- `src/lib/chat/anthropic.ts` — client creation, streaming utilities

---

## Steps

### 1. Install @anthropic-ai/sdk
- `npm install @anthropic-ai/sdk`
- Verify it works with Cloudflare Workers (edge-compatible)

### 2. Create IAIProvider interface
- File: `src/lib/chat/types.ts`
- Define `IAIProvider` with `streamChat()` method
- Define `ChatMessage`, `StreamEvent` types
- Keep it minimal — only what ghost conversations need

### 3. Create AnthropicAIProvider
- File: `src/lib/chat/anthropic-ai-provider.ts`
- Implement `streamChat()` using Anthropic SDK's streaming API
- Model: `claude-sonnet-4-5-20250929` (same as agentbase.me)
- Max tokens: 4096, Temperature: 0
- Handle stream events: `content_block_delta` (text chunks), `message_stop`
- Return async iterator or use callback pattern for streaming

### 4. Create ChatEngine
- File: `src/lib/chat/chat-engine.ts`
- Constructor takes `{ aiProvider: IAIProvider }`
- `processMessage(opts)` method:
  - Takes: systemPrompt, messages (history), userMessage
  - Calls aiProvider.streamChat()
  - Yields stream events
- Keep it simple — no tool execution, no token budgets (add later)

### 5. Wire ANTHROPIC_API_KEY
- Add to `wrangler.toml` as secret reference
- Create `src/lib/chat/create-client.ts` — reads from `process.env.ANTHROPIC_API_KEY`
- Document: user must run `npx wrangler secret put ANTHROPIC_API_KEY`

---

## Verification

- [ ] `@anthropic-ai/sdk` installed and builds successfully
- [ ] IAIProvider interface defined with streamChat method
- [ ] AnthropicAIProvider streams text from Claude
- [ ] ChatEngine orchestrates message → stream flow
- [ ] ANTHROPIC_API_KEY documented as required secret
- [ ] Build passes (no type errors)

---

**Next Task**: [Task 29: Ghost Streaming Endpoint](task-29-ghost-streaming-endpoint.md)
