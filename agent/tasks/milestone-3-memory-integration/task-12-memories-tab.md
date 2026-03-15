# Task 12: Memories Tab & Feed

**Milestone**: [M3 - Memory Integration](../../milestones/milestone-3-memory-integration.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 11 (Save-as-Memory)
**Status**: Not Started

---

## Objective

Build the Memories tab with a searchable memory feed supporting multiple sort algorithms, scope filtering, and simplified MemoryCard rendering.

---

## Steps

### 1. Memories Tab Route
- Add `/memories` route in TanStack Router
- Tab navigation: Chat | Memories | Ghost
- Tab uses `useTheme()` for active/inactive styling

### 2. Memory Feed
- Fetch memories via `remember-core` SvcClient (getFeed/search)
- Algorithm selector: smart, chronological, discovery, rating, significance
- FilterTabs component for algorithm switching
- Infinite scroll or pagination

### 3. MemoryCard Component
- Simplified version of agentbase.me's MemoryCard
- Title, content preview (truncated), author, created_at, tags
- Star rating display
- Click to expand full content
- Use `useTheme()` for card styling

### 4. Scope Filter
- Filter by: All, Personal, Groups, Spaces
- Scope selector in feed header
- Filters map to `remember-core` getFeed scope params

### 5. Search
- Search bar at top of memories tab
- Hybrid semantic + keyword search via `remember-core`
- Results replace feed content

---

## Verification

- [ ] Memories tab renders memory feed
- [ ] Algorithm switching changes feed order
- [ ] Scope filter limits results correctly
- [ ] Search returns relevant memories
- [ ] MemoryCard displays all required fields
- [ ] Infinite scroll loads more results

---

**Next Task**: [Task 13: MCP Tool Invocation](task-13-mcp-tool-invocation.md)
