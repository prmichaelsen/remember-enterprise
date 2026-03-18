# Task 81: Group Ghost System Prompt

**Milestone**: M17 - Group Ghost Chat
**Status**: Not Started
**Estimated Hours**: 0.25
**Priority**: P1

---

## Objective

Extend the `buildSystemPrompt()` method in ChatRoom DO to handle `ghostType === 'group'` with a system prompt that instructs the ghost to search group memories on every message, attribute findings to specific members, and speak in an agent-style voice.

---

## Context

Group ghosts differ from space ghosts in persona and behavior:

| Aspect | Group Ghost | Space Ghost |
|--------|-------------|-------------|
| **Identity** | Knowledgeable agent | Collective entity |
| **Voice** | "I found..." | "I am the voice of all" |
| **Attribution** | Always to members | Never (collective) |
| **Tool Access** | Full agent capabilities | Restricted to memory tools |
| **Use Case** | Team knowledge base | Public collective memory |

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md:174-187` (comparison table)

The current `buildSystemPrompt()` method in `chat-room.ts` handles `ghostType === 'space'`. We need to add a case for `ghostType === 'group'`.

**Key Requirements**:
1. **Search on every message**: Ghost must actively query group memories
2. **Attribution**: Always cite specific authors (e.g., "According to @alice's notes...")
3. **Agent-style voice**: Helpful assistant, not collective identity
4. **Tool usage**: `remember_search_space({ groups: [groupId] })` for searching group memories

---

## Steps

### 1. Read Current buildSystemPrompt() Implementation

Read `src/durable-objects/chat-room.ts` and locate the `buildSystemPrompt()` method.

Current implementation (from M15):
```typescript
private buildSystemPrompt(ghostOwner: string | undefined, conversationId: string): string {
  if (!ghostOwner) {
    return 'You are a helpful AI assistant. Be concise and accurate.'
  }

  const [ghostType, ghostId] = ghostOwner.split(':', 2)

  if (ghostType === 'space') {
    // Space ghost prompt...
  }

  // Default fallback
  return 'You are a helpful AI assistant. Be concise and accurate.'
}
```

### 2. Add Group Ghost Case

Add a new conditional block for `ghostType === 'group'` before the default fallback:

```typescript
if (ghostType === 'group') {
  const groupName = ghostId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return `You are the Ghost of ${groupName} — a knowledgeable AI agent that represents the collective knowledge of this group.

IMPORTANT: On EVERY user message, you MUST search the group's memories using the available memory search tools before responding.

Your role:
- Search memories published to this group using remember_search_space with the groups filter
- Provide helpful, accurate answers based on what group members have shared
- Act as a resource for the team's collective knowledge

Attribution Rules:
- ALWAYS attribute memories to specific authors when sharing information
- Use patterns like: "According to [author]'s notes...", "[Author] shared that...", "In a memory by [author]..."
- Members want to know who contributed what — attribution is essential

Voice and Style:
- Speak as a helpful agent, not a collective entity
- Use phrases like "I found..." or "Based on what's been shared..."
- Do NOT use collective identity phrases like "I am the voice of all"

Tool Usage:
- Use remember_search_space({ groups: ['${ghostId}'] }) to search group memories
- Search proactively on every message — do not wait to be asked
- If no relevant memories are found, acknowledge that nothing has been shared about that topic yet

Be concise, helpful, and always cite your sources.`
}
```

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md:211-223` (agentbase.me system prompt pattern)

### 3. Verify Prompt Injection Point

Ensure `buildSystemPrompt()` is called in the correct places:
- `handleMessage()` method when processing user messages
- `ghostOwner` parameter passed from WebSocket message to `buildSystemPrompt()`

From M15 implementation, this should already be wired:
```typescript
const systemPrompt = this.buildSystemPrompt(ghostOwner, conversationId)
```

### 4. Test Group Ghost Prompt

Manual testing:
1. Navigate to a group page
2. Click Ghost tab
3. Send a message (e.g., "What has been shared in this group?")
4. Verify ghost response:
   - Searches group memories (check MCP tool calls in debug logs)
   - Attributes findings to specific members
   - Uses agent-style voice

---

## Verification Checklist

- [ ] `buildSystemPrompt()` method has `if (ghostType === 'group')` case
- [ ] Group name is extracted and humanized (underscores to spaces, title case)
- [ ] System prompt includes "search on EVERY message" instruction
- [ ] Attribution requirements are explicit ("ALWAYS attribute to authors")
- [ ] Agent-style voice is emphasized (not collective identity)
- [ ] Tool usage instruction includes `remember_search_space({ groups: ['${ghostId}'] })`
- [ ] Ghost responds to messages in group ghost conversations
- [ ] Ghost searches memories on every message (visible in tool call events)
- [ ] Ghost attributes findings to specific members
- [ ] Ghost uses agent-style language (not "voice of all")

---

## Files Modified

- `src/durable-objects/chat-room.ts` (add group ghost case to buildSystemPrompt)

---

## Dependencies

- **Blocked by**: Task 80 (ghost tab UI must exist to test)
- **Blocks**: Task 82 (context enrichment enhances this prompt)

---

## Related Documents

- agent/reports/audit-32-agentbase-group-ghost-ux.md:211-223 (system prompt pattern)
- agent/reports/audit-32-agentbase-group-ghost-ux.md:174-187 (group vs space ghost comparison)
- src/durable-objects/chat-room.ts (file to modify)

---

## Notes

- Group name humanization (`band_mates` → `Band Mates`) improves prompt readability
- Attribution is critical for group ghosts — members need to know who contributed knowledge
- Agent-style voice distinguishes group ghosts from space ghosts (collective identity)
- The ghost will use `remember_search_space` with `groups` filter, not `remember_search_internal_memory`
- Internal memory tools (ghost's own context) are separate from group memory search

---

**Created**: 2026-03-18
**Estimated Hours**: 0.25 (15 minutes)
