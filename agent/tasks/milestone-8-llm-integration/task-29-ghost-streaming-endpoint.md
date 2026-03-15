# Task 29: Ghost Streaming Endpoint

**Milestone**: [M8 - LLM Integration](../../milestones/milestone-8-llm-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 28
**Status**: Not Started

---

## Objective

Create the SSE streaming endpoint at `/api/ghosts/conversations/$conversationId/messages/stream` that the GhostChat component calls via `GhostService.sendMessageStreaming()`. This endpoint persists the user message, invokes ChatEngine, streams the response, and persists the assistant message.

---

## Context

The client-side is already built:
- `GhostChat.tsx` calls `GhostService.sendMessageStreaming(conversationId, content, callbacks)`
- `ghost.service.ts` POSTs to `/api/ghosts/conversations/${conversationId}/messages/stream`
- Expects SSE format: `data: {"chunk":"..."}` lines, ending with `data: [DONE]`
- Callbacks: `onChunk(text)`, `onComplete(fullText)`, `onError(error)`

---

## Steps

### 1. Create route file
- File: `src/routes/api/ghosts/conversations/$conversationId.messages.stream.tsx`
- Use `createFileRoute` + `server.handlers.POST`

### 2. Implement POST handler
```
1. Auth guard (getServerSession)
2. Parse body: { content: string }
3. Load ghost persona for this conversation (GhostDatabaseService)
4. Load conversation history (last 50 messages)
5. Persist user message to Firestore
6. Build system prompt from ghost persona systemPromptFragment
7. Instantiate ChatEngine with AnthropicAIProvider
8. Stream response:
   - Return Response with `text/event-stream` content-type
   - Use ReadableStream with controller
   - For each chunk from ChatEngine: controller.enqueue(`data: {"chunk":"..."}\n\n`)
   - On complete: controller.enqueue(`data: [DONE]\n\n`), close
9. Persist assistant message to Firestore (after stream completes)
```

### 3. Handle edge cases
- Conversation not found → 404
- Ghost persona not found → 404
- ANTHROPIC_API_KEY not set → 500 with clear error
- Client disconnects mid-stream → abort ChatEngine via AbortSignal
- Empty content → 400

---

## Verification

- [ ] POST to endpoint returns `text/event-stream` response
- [ ] Text chunks arrive progressively (not all at once)
- [ ] User message persisted before streaming starts
- [ ] Assistant message persisted after streaming completes
- [ ] GhostChat UI renders streaming response with blob cursor
- [ ] Error cases return appropriate status codes
- [ ] Build passes

---

**Next Task**: [Task 30: Memory-Augmented System Prompts](task-30-memory-augmented-prompts.md)
