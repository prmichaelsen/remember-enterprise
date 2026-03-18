# Task 82: Group Ghost Context Enrichment

**Milestone**: M17 - Group Ghost Chat
**Status**: Not Started
**Estimated Hours**: 0.33
**Priority**: P2

---

## Objective

Enhance group ghost persona relevance by fetching group metadata (name, description) from Firestore and injecting it into the system prompt. Additionally, document and optionally enforce a tool access policy for group ghosts.

---

## Context

Currently (after Task 81), the group ghost system prompt uses a humanized version of the `ghostId` (e.g., `band_mates` → `Band Mates`). This is functional but generic.

By fetching the actual group document from Firestore, we can:
- Use the real group name (as stored in the database)
- Inject the group description to shape the ghost's persona
- Provide context about the group's purpose and scope

**Example**:
- `ghostId`: `band_mates`
- Firestore doc: `{ name: "The Band Mates", description: "A private group for discussing music projects and tour logistics" }`
- Enhanced prompt: "You are the Ghost of The Band Mates — a group focused on music projects and tour logistics. When searching memories, prioritize topics related to songwriting, rehearsals, and tour planning."

**Tool Access Policy**:
agentbase.me grants group ghosts **full tool access** (no allowlist), making them suitable for enterprise teams that may ask the ghost to perform actions beyond memory search (e.g., web search, calculations, integrations).

memorycloud.chat should decide:
- **Full access** (like agentbase.me) — ghost can use all MCP tools
- **Memory-only** — restrict to `remember_*` tools only

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md:263-267` (tool access considerations)

---

## Steps

### 1. Fetch Group Metadata in ChatRoom DO

In `chat-room.ts`, add a method to fetch group data:

```typescript
private async fetchGroupMetadata(groupId: string): Promise<{ name: string; description?: string } | null> {
  try {
    // Use GroupDatabaseService or direct Firestore query
    const groupDoc = await this.env.FIRESTORE.collection('groups').doc(groupId).get()
    if (!groupDoc.exists) {
      return null
    }
    const data = groupDoc.data()
    return {
      name: data.name || groupId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: data.description || undefined,
    }
  } catch (error) {
    console.error('[ChatRoom] Failed to fetch group metadata:', error)
    return null
  }
}
```

**Note**: Adjust based on your Firestore binding and service architecture. May need to use `GroupDatabaseService` instead of direct Firestore access.

### 2. Update buildSystemPrompt() to Use Real Metadata

Modify the `ghostType === 'group'` case in `buildSystemPrompt()`:

```typescript
if (ghostType === 'group') {
  // Fetch group metadata (async, so this requires making buildSystemPrompt async or caching)
  const groupMetadata = await this.fetchGroupMetadata(ghostId)
  const groupName = groupMetadata?.name || ghostId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const groupDescription = groupMetadata?.description

  let promptContext = `You are the Ghost of ${groupName} — a knowledgeable AI agent...`

  if (groupDescription) {
    promptContext += `\n\nGroup Context: ${groupDescription}\nUse this context to better understand the group's focus and priorities when searching memories.`
  }

  // ... rest of prompt
}
```

**Async Consideration**: `buildSystemPrompt()` is currently synchronous. You'll need to either:
- Make it async and update all call sites
- Pre-fetch group metadata during conversation initialization and cache it

**Recommendation**: Pre-fetch and cache group metadata in the ChatRoom DO state when `ghostOwner` is first set.

### 3. Cache Group Metadata on Conversation Init

In `handleInit()` or `handleMessage()` (first message), when `ghostOwner` is detected:

```typescript
private groupMetadataCache = new Map<string, { name: string; description?: string }>()

// In handleInit or handleMessage (first time ghostOwner is seen):
if (ghostOwner && ghostOwner.startsWith('group:')) {
  const groupId = ghostOwner.split(':', 2)[1]
  if (!this.groupMetadataCache.has(groupId)) {
    const metadata = await this.fetchGroupMetadata(groupId)
    if (metadata) {
      this.groupMetadataCache.set(groupId, metadata)
    }
  }
}

// In buildSystemPrompt (now synchronous):
if (ghostType === 'group') {
  const groupMetadata = this.groupMetadataCache.get(ghostId)
  // ... use cached metadata
}
```

### 4. Document Tool Access Policy

Create or update `agent/design/local.group-ghost-tool-policy.md`:

```markdown
# Group Ghost Tool Access Policy

**Decision**: [Choose one]
- **Full Access** (like agentbase.me) — group ghosts can use all MCP tools
- **Memory-Only** — restrict to `remember_*` tools only

**Rationale**: [Document reasoning]

**Implementation**:
- Full access: No changes needed (default behavior)
- Memory-only: Add tool allowlist filtering in MCPProvider

**Future**: Consider per-group tool policy customization (admin settings)
```

### 5. (Optional) Implement Memory-Only Tool Restriction

If memory-only policy is chosen, add filtering in `mcp-provider.ts`:

```typescript
async getTools(connections: MCPClientConnection[]): Promise<Tool[]> {
  const { tools } = await getToolsFromMCPServers(connections)

  // Filter for group ghosts if memory-only policy
  if (this.internalContext?.ghostType === 'group' && MEMORY_ONLY_POLICY) {
    return tools.filter(tool => tool.name.startsWith('remember_'))
  }

  return tools
}
```

**Note**: This is OPTIONAL and depends on product decision. agentbase.me does NOT restrict tools for group ghosts.

### 6. Test Context Enrichment

Manual testing:
1. Create a test group with name "Engineering Team" and description "Discuss engineering projects and technical decisions"
2. Navigate to group ghost tab
3. Send a message
4. Verify system prompt includes:
   - Real group name ("Engineering Team")
   - Group description in context section
5. Verify ghost's responses are more contextually relevant

---

## Verification Checklist

- [ ] `fetchGroupMetadata()` method fetches group name and description from Firestore
- [ ] Group metadata cached in ChatRoom DO (synchronous access)
- [ ] `buildSystemPrompt()` uses real group name from cache
- [ ] Group description injected into prompt when available
- [ ] Tool access policy documented in design doc
- [ ] Tool restriction implemented (if memory-only policy chosen)
- [ ] Ghost uses real group name in responses
- [ ] Group description influences ghost's focus/priorities
- [ ] No performance issues from metadata fetching

---

## Files Modified

- `src/durable-objects/chat-room.ts` (add fetchGroupMetadata, cache, update buildSystemPrompt)
- `agent/design/local.group-ghost-tool-policy.md` (create policy doc)
- `src/lib/chat/mcp-provider.ts` (optional tool filtering if memory-only policy)

---

## Dependencies

- **Blocked by**: Task 81 (system prompt must exist)
- **Blocks**: None

---

## Related Documents

- agent/reports/audit-32-agentbase-group-ghost-ux.md:263-267 (tool access considerations)
- agent/reports/audit-32-agentbase-group-ghost-ux.md:268-271 (group name context)
- src/durable-objects/chat-room.ts (file to modify)

---

## Notes

- Group metadata caching avoids repeated Firestore queries
- Async handling requires careful consideration (pre-fetch vs async prompt generation)
- Tool access policy is a product decision, not a technical constraint
- agentbase.me uses full tool access for group ghosts (enterprise use case)
- Memory-only restriction is more conservative but limits functionality
- Group description can significantly improve ghost persona relevance

---

**Created**: 2026-03-18
**Estimated Hours**: 0.33 (20 minutes)
