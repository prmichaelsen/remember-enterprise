# Task 30: Memory-Augmented System Prompts

**Milestone**: [M8 - LLM Integration](../../milestones/milestone-8-llm-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 29
**Status**: Not Started

---

## Objective

Inject user's relevant memories into the ghost system prompt so AI responses are contextually aware of the user's stored knowledge. Port the memory context pattern from agentbase.me's ChatEngine and GhostDatabaseService.

---

## Context

GhostDatabaseService.sendMessage() already queries memories via `getRememberSvcClient()`:
```typescript
const svc = await getRememberSvcClient()
const memoryContext = await svc.memories.search(userId, { query: message, limit: 5 })
```

This memory context needs to be:
1. Formatted into the system prompt
2. Scoped by ghost persona trust tier
3. Passed alongside conversation history to ChatEngine

agentbase.me's approach:
- System prompt = base prompt + ghost persona fragment + memory context block
- Memory context formatted as `<memories>...</memories>` XML block
- Trust tier controls which memory scopes are queried (personal, groups, spaces)

---

## Steps

### 1. Create prompt builder
- File: `src/lib/chat/prompt-builder.ts`
- `buildGhostSystemPrompt(opts)`:
  - `ghostPersona`: name, description, systemPromptFragment
  - `memoryContext`: array of memory objects from SvcClient
  - Returns composed system prompt string

### 2. Memory context formatting
- Format memories as structured context block:
  ```
  <memories>
  <memory title="..." created="..." scope="...">
  Content of the memory...
  </memory>
  ...
  </memories>
  ```
- Include: title, content, created date, scope
- Limit to 5-10 most relevant memories
- If no memories found, omit the block entirely

### 3. Trust tier scoping
- Map ghost `trustTier` to memory search scopes:
  - `public` → search only public/spaces memories
  - `friends` → search public + friends memories
  - `inner-circle` → search public + friends + group memories
  - `private` → search all scopes including personal
- Pass scope filter to `svc.memories.search()`

### 4. Wire into streaming endpoint
- In Task 29's endpoint handler, before calling ChatEngine:
  1. Query memories via SvcClient with trust-tier-scoped search
  2. Build system prompt via `buildGhostSystemPrompt()`
  3. Pass system prompt + conversation history to ChatEngine

### 5. Conversation history formatting
- Load last 50 messages from Firestore
- Map to `{ role: 'user' | 'assistant', content: string }` format
- Pass as message history to ChatEngine

---

## Verification

- [ ] System prompt includes ghost persona fragment
- [ ] Memory context block injected when relevant memories exist
- [ ] Memory context omitted when no memories found
- [ ] Trust tier filtering works (public ghost doesn't see personal memories)
- [ ] Ghost responses reference user's memories when relevant
- [ ] Conversation history provides multi-turn context
- [ ] Build passes

---

**Next Task**: None (M8 complete)
