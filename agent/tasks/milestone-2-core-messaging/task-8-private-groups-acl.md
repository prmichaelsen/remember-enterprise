# Task 8: Private Groups & ACL

**Milestone**: [M2 - Core Messaging](../../milestones/milestone-2-core-messaging.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 7 (DM Conversations)
**Status**: Not Started

---

## Objective

Implement private group conversations with ACL-based permissions reused from agentbase.me's GroupAclService and MessageAclService.

---

## Steps

### 1. Group Creation
- Create group entity in Firestore with `is_discoverable: false`
- Set creator as owner (auth_level: 0, OWNER_PRESET permissions)
- Group metadata: name, description, member list

### 2. Member Management
- Invite users by name/email
- New members get MEMBER_PRESET permissions (auth_level: 5)
- Remove members (requires `can_manage_members`)
- Member list view with role badges

### 3. ACL Enforcement
- Reuse GroupAclService to validate access on every group action
- Reuse MessageAclService for message-level visibility
- `@agent` mentions create private responses (visible_to_user_ids: [senderId])
- Permission checks: can_read, can_publish, can_manage_members

### 4. Group Chat UI
- Same chat UI as DMs but with multi-participant indicators
- Member count and "View members" action
- Group name/description in header

---

## Verification

- [ ] User can create a private group
- [ ] Members can be invited and removed
- [ ] Non-members cannot access the group
- [ ] ACL permission presets applied correctly
- [ ] Message-level ACL filters private @agent responses

---

**Next Task**: [Task 9: Real-Time Message Delivery](task-9-realtime-messages.md)
