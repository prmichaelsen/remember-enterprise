# Task 34: MCP Tool API Routes

**Milestone**: [M10 - Groups & MCP API](../../milestones/milestone-10-groups-mcp-api.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 2-3 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create API routes for MCP tool invocation so @agent commands work in chat.

---

## Steps

### 1. Read `src/services/mcp.service.ts` for fetch URLs

### 2. Create tool routes
- **GET** `/api/mcp/tools` — list available tools
  - Return tool registry (name, description, parameters)
- **POST** `/api/mcp/tools/$toolName/invoke` — invoke a tool
  - Body: `{ args }`
  - Execute tool, return result
  - For now: stub tool execution with remember-core memory search as the primary tool
- **GET** `/api/mcp/tools/$toolName/schema` — get tool parameter schema

### 3. Wire to remember-core
- Primary tool: `memory-search` — calls `svc.memories.search()` via SvcClient
- Secondary tool: `memory-save` — calls `svc.memories.create()`
- Return results in a format the `AgentResult` component can render

---

## Verification

- [ ] `/api/mcp/tools` returns tool list
- [ ] Tool invocation returns results
- [ ] @agent memory-search in chat triggers real search
- [ ] Client service fetch URLs match route paths
