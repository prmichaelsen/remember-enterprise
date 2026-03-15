# Milestone 10: Groups & MCP API

**Status**: Not Started
**Estimated Duration**: 1 week
**Dependencies**: M9 (Messaging API)
**Source**: Audit #3 — missing group and MCP tool API routes

---

## Goal

Create the group management API routes (CRUD, members, ACL) and MCP tool invocation routes so that group chat and @agent commands work end-to-end.

## Deliverables

- `/api/groups` CRUD routes
- `/api/groups/$id/members` routes (add/remove/list)
- ACL permission enforcement on group operations
- `/api/mcp/tools` routes (list, invoke, schema)

## Success Criteria

- [ ] Groups can be created, updated, deleted via API
- [ ] Members can be added/removed with ACL enforcement
- [ ] MCP tools can be listed and invoked via @agent commands
- [ ] Group service client calls all resolve to working endpoints

## Tasks

- [Task 33: Group API Routes](../tasks/milestone-10-groups-mcp-api/task-33-group-api-routes.md)
- [Task 34: MCP Tool API Routes](../tasks/milestone-10-groups-mcp-api/task-34-mcp-tool-api-routes.md)
