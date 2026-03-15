# Task 33: Group API Routes

**Milestone**: [M10 - Groups & MCP API](../../milestones/milestone-10-groups-mcp-api.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create API routes for group management that `group.service.ts` calls, wired to `GroupDatabaseService`.

---

## Steps

### 1. Read `src/services/group.service.ts` for fetch URLs

### 2. Create group CRUD routes
- **POST** `/api/groups` — create group
- **GET** `/api/groups/$groupId` — get group
- **PATCH** `/api/groups/$groupId` — update group
- **DELETE** `/api/groups/$groupId` — delete group

### 3. Create member management routes
- **GET** `/api/groups/$groupId/members` — list members
- **POST** `/api/groups/$groupId/members` — add member (body: `{ userId }`)
- **DELETE** `/api/groups/$groupId/members/$userId` — remove member

### 4. Create ACL route
- **GET** `/api/groups/$groupId/permissions/$userId` — check user permissions
  - Call `GroupDatabaseService.checkPermission(groupId, userId, permission)`

All routes enforce ACL — only owners/admins can manage members, only members can read.

---

## Verification

- [ ] Groups can be created and retrieved via API
- [ ] Members can be added/removed
- [ ] ACL prevents unauthorized access
- [ ] Client service fetch URLs match route paths
