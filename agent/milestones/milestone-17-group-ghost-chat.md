# Milestone 17: Group Ghost Chat

**ID**: M17
**Status**: Not Started
**Estimated Duration**: 1 week
**Priority**: P1

---

## Goal

Implement group ghost conversations that enable teams to query collective knowledge from private group memories with attribution to specific members.

Group ghosts act as **knowledgeable agents** (not collective identities like space ghosts) that search group-published memories, attribute findings to specific members, and optionally perform non-memory actions via MCP tools.

---

## Context

This milestone ports the agentbase.me group ghost pattern to memorycloud.chat. The infrastructure is already in place from M15 (Ghost Space Integration):

- ✅ ghostOwner parameter flow (route → WebSocket → ChatRoom → ChatEngine → MCP headers)
- ✅ MCP header injection for `group:` prefix (`mcp-client.ts:229-230`)
- ✅ remember-mcp auto-scoping via headers (no code changes needed)

What's new:
- Group-specific UI (Ghost tab on group pages)
- Group ghost persona system prompt (attribution requirements, agent-style voice)
- Group context enrichment (name/description injection)

**Reference**: `agent/reports/audit-32-agentbase-group-ghost-ux.md` (comprehensive UX audit from agentbase.me)

---

## Deliverables

1. **Group Route UI with Ghost Tab**
   - Ghost tab added to `/groups/$groupId` route
   - `GROUP_GHOST_SEED` message constant
   - GhostChatView rendered with `ghostOwnerId="group:{groupId}"`

2. **Group Ghost System Prompt**
   - Extend `buildSystemPrompt()` in ChatRoom DO for `ghostType === 'group'`
   - Attribution requirements: "ALWAYS attribute memories to specific authors"
   - Agent-style voice (not collective identity)
   - Search-on-every-message instruction

3. **Group Context Enrichment**
   - Fetch group name/description in ChatRoom DO
   - Inject into system prompt for persona relevance
   - Tool access policy decision (full access vs memory-only)

---

## Success Criteria

- [ ] Ghost tab visible on all group pages
- [ ] Clicking Ghost tab loads ghost conversation UI
- [ ] Group ghost responds with memories attributed to members (e.g., "According to @alice's notes...")
- [ ] Group ghost uses agent-style voice (not "I am the voice of all")
- [ ] Group ghost searches group memories on every user message
- [ ] Group name appears in system prompt
- [ ] Tool access policy is documented and enforced

---

## Dependencies

- **Blocked by**: None (M15 infrastructure complete)
- **Blocks**: None
- **Related**: M15 (Ghost Space Integration), Audit #32

---

## Technical Approach

### 1. Route Integration
Add Ghost tab to `/groups/$groupId` route following agentbase.me pattern:
- Import GhostChatView component
- Define `GROUP_GHOST_SEED` constant
- Render GhostChatView when `activeTab === 'ghost'` with `ghostOwnerId="group:{groupId}"`

### 2. System Prompt Enhancement
Extend `buildSystemPrompt()` method in `chat-room.ts`:
```typescript
if (ghostType === 'group') {
  return `You are the Ghost of ${groupName} — a knowledgeable AI agent...

  IMPORTANT: On EVERY user message, search group memories...

  Attribution: ALWAYS attribute memories to specific authors.`
}
```

### 3. Context Enrichment
Fetch group metadata in ChatRoom DO:
- Read group document from Firestore
- Extract `name` and `description` fields
- Inject into system prompt for persona shaping

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Group route doesn't exist yet | High | Verify route structure first; create minimal group page if needed |
| Tool access confusion | Medium | Document policy clearly; default to memory-only tools if uncertain |
| Attribution format ambiguity | Low | Use agentbase.me's attribution examples from audit report |

---

## Testing Strategy

- **Unit**: System prompt generation for group ghosts
- **Integration**: Verify `remember_search_space({ groups: [groupId] })` hits correct collection
- **E2E**: Open group ghost tab → send message → verify attributed response from group memories

---

## Out of Scope

- Group ghost settings/customization (future enhancement)
- Multi-group ghost (spans multiple related groups)
- Ghost analytics for group admins
- Custom instructions per group

---

## Notes

- Group ghosts are the **most capable** ghost type if we grant full tool access
- Space ghosts speak as **collective identity** ("I am the voice of all"), group ghosts as **helpful agent** ("I found...")
- No remember-core or remember-mcp changes needed (reuses existing tools)
- Pattern is fully portable from agentbase.me via audit report

---

**Created**: 2026-03-18
**Last Updated**: 2026-03-18
**Related Documents**:
- agent/reports/audit-32-agentbase-group-ghost-ux.md (source audit)
- agent/milestones/milestone-15-ghost-space-integration.md (related infrastructure)
