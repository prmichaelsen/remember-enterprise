# Remember Enterprise — Product Requirements

**Concept**: Slack-like enterprise memory platform that integrates with agentbase.me, giving users a familiar team chat UX for interacting with memories, MCP tools, and shared spaces
**Created**: 2026-03-15
**Last Updated**: 2026-03-16
**Status**: Implemented (MVP Complete)

---

## Overview

Remember Enterprise is a standalone, multi-tenant messaging application modeled after Slack's UX paradigm. It plugs directly into agentbase.me's backend (shared Firestore, shared auth) so that users get immediate access to their memories, MCP servers, spaces, and relationships — but through a familiar team-chat interface rather than agentbase.me's more exploratory UX.

The core pain point is that agentbase.me's UX feels unfamiliar and restrictive to users accustomed to team collaboration tools. Remember Enterprise solves this by providing a Slack-like experience with zero ramp-up, while retaining full access to agentbase.me's powerful memory and AI capabilities.

---

## Problem Statement

- **User confusion**: agentbase.me's UX doesn't clearly communicate whether it's a social media app, note-taking app, or enterprise collaboration tool. Users can't get started quickly.
- **Adoption friction**: Teams accustomed to Slack/Teams/Discord find agentbase.me's paradigm unfamiliar and restrictive.
- **Underutilized capabilities**: agentbase.me's memory, MCP, and AI features are powerful but hidden behind a UX that doesn't match enterprise workflows.

Without a familiar entry point, enterprise adoption of the memory platform stalls regardless of backend capability.

---

## Solution

Build a Slack-clone frontend that shares agentbase.me's database and auth system, enabling users to:
- Chat via DMs and private groups (mapped to agentbase.me's group entities)
- Interact with memories through familiar message-based workflows (save-as-memory CTA on each message)
- Invoke MCP tools via `@agent` or `/agent` commands with inline results
- Browse memories, spaces, and AI personas through tabbed navigation (chat, memories, ghost)

The product is standalone with its own branding but requires an agentbase.me account (users can register from either product).

---

## Implementation

### Architecture

```
┌─────────────────────────────────────┐
│       Remember Enterprise           │
│   (TanStack Start + Cloudflare)     │
├─────────────────────────────────────┤
│  WebSocket (Durable Objects)        │
│  Session Auth (Firebase cookies)    │
│  ACL (reused from agentbase.me)     │
├─────────────────────────────────────┤
│  @prmichaelsen/remember-core        │
│  (Memory CRUD, Search, Spaces,      │
│   Relationships, Ratings)           │
├─────────────────────────────────────┤
│  Shared Firestore + Weaviate        │
│  (same instance as agentbase.me)    │
└─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React + Vinxi) |
| Deployment | Cloudflare Workers/Pages |
| Real-time | WebSockets via Durable Objects |
| Database | Firestore (shared with agentbase.me) |
| Vector DB | Weaviate (via remember-core) |
| Auth | Firebase Auth (shared with agentbase.me), cookie-based sessions |
| Memory SDK | `@prmichaelsen/remember-core` (SvcClient) |
| Patterns | `acp-tanstack-cloudflare` package (48 patterns, 39 templates) |

### Data Model

Remember Enterprise does not define its own data models. It reuses:

- **Messages**: Firestore conversations (same schema as agentbase.me chat)
- **Memories**: Weaviate via remember-core services (`Memory_users_{userId}`, `Memory_groups_{groupId}`, `Memory_spaces_public`)
- **Groups**: Firestore group entities with MemberPermissions ACL
- **Users**: Firebase Auth users (shared)
- **Spaces**: Firestore space metadata (`the_void`, custom spaces)
- **Relationships**: Weaviate via remember-core RelationshipService

### Memory Scopes (ported from agentbase.me)

| Scope | Slack Analogue | Implementation |
|---|---|---|
| Personal | Private notes/bookmarks | `scope: 'personal'`, user's collection |
| Groups | Private channels/teams | `scope: 'groups'`, ACL-gated, `is_discoverable: false` |
| Public Spaces (the_void) | Public channels (P3) | `scope: 'spaces'`, discoverable feeds |
| Friends | Shared-with-me feed | `published_to_friends` flag |

### ACL (reused from agentbase.me)

**Group-Level** (GroupAclService):
- `auth_level`: 0=owner, 1=admin, 3=editor, 5=member
- Granular permissions: `can_read`, `can_publish`, `can_manage_members`, `can_moderate`, `can_kick`, `can_ban`, etc.
- Presets: OWNER, ADMIN, EDITOR, MEMBER

**Message-Level** (MessageAclService):
- `visible_to_user_ids: null` → visible to all participants
- `visible_to_user_ids: [senderId]` → private (e.g., `@agent` responses visible only to sender)

### MCP Tool Interaction

- Users invoke tools via `@agent` or `/agent` in chat messages
- Tool results render inline via ToolCallBadge components and streaming blocks architecture (interleaved text + tool_use blocks)
- AI responses use MarkdownContent rendering with syntax-highlighted code blocks
- All agentbase.me MCP servers available for free by sharing the database

### Navigation & Pages

Sidebar navigation with the following routes:
- **Chat** (`/chat`) — conversations list (DMs, groups)
- **Conversation** (`/chat/$conversationId`) — individual conversation view with header menus for member management; sub-tabs: Chat, Ghost
- **Memories** (`/memories`) — searchable feed with algorithm selection (smart, chronological, discovery, rating, significance)
- **Friends** (`/friends`) — relationships management (friend requests, friend list)
- **Void** (`/void`) — anonymous posting feed (maps to `the_void` public space)
- **Conversations** (`/conversations`) — conversation discovery/management
- **Settings** (`/settings`) — searchable settings registry
- **Auth** (`/auth`) — authentication (login, register)
- **Invite Links** — shareable links for onboarding:
  - `/dm-links/$linkId` — DM invite links
  - `/friend-links/$linkId` — friend request links
  - `/group-links/$linkId` — group invite links

---

## Feature Prioritization

### P0 (MVP)

| Feature | Notes |
|---|---|
| Direct messages (1:1) | Core messaging |
| Private groups | Groups = private channels, group DMs are private groups under the hood |
| File/image uploads | Essential for team communication |
| In-app notifications | Real-time awareness |
| Push notifications | Mobile/background awareness |
| Save-as-memory CTA | Button on each message to create memory |
| Memories tab | Searchable feed with algorithm selection |
| `@agent` / `/agent` commands | MCP tool invocation with inline results |
| Auth (shared with agentbase.me) | Firebase cookie-based sessions |
| ACL (reused from agentbase.me) | Group-level + message-level permissions |
| Algolia-powered global search | Command palette (Cmd+K) with cross-entity search |
| Invite link system | DM links, friend links, group links for sharing/onboarding |
| Friends/relationships page | Friend requests, friend list management |
| The Void | Anonymous posting feed (public space) |
| Settings page | Searchable settings registry |
| Conversation header menus | Member management, group settings from conversation view |
| Streaming blocks architecture | Interleaved text + tool_use blocks for AI responses |
| MarkdownContent rendering | Syntax-highlighted code blocks, rich text rendering |
| MCP tool UI | ToolCallBadge components for inline tool result display |

### P1

| Feature | Notes |
|---|---|
| Threaded replies | Conversation threading |
| Message reactions/emoji | Social engagement |
| Message search | Full-text search across conversations |

### P2

| Feature | Notes |
|---|---|
| User presence (online/offline) | Awareness indicator |
| Threads (expanded) | More Slack-like thread UX |
| Search (expanded) | Advanced filters |

### P3

| Feature | Notes |
|---|---|
| Public channels | Maps to public spaces |

### P10+

| Feature | Notes |
|---|---|
| Multiple workspaces | Slack-like org switching |

---

## Benefits

- **Zero ramp-up**: Users already know how to use Slack-like interfaces
- **Full platform access**: All agentbase.me capabilities (memories, MCP, AI) through familiar UX
- **Shared infrastructure**: No data migration or sync — same database, same auth
- **Multi-tenant ready**: SaaS or self-hosted deployment, unbounded team sizes
- **Pattern reuse**: acp-tanstack-cloudflare provides 48 battle-tested patterns

---

## Trade-offs

- **Shared database coupling**: remember-enterprise and agentbase.me are tightly coupled through Firestore. Schema changes in agentbase.me affect remember-enterprise.
  - *Mitigation*: Consume via `@prmichaelsen/remember-core` SDK, never access Firestore/Weaviate directly. SDK provides a stable API surface.
- **Feature parity pressure**: Users may expect full Slack feature set (threads, search, integrations) from day one.
  - *Mitigation*: Clear P0/P1/P2 prioritization. MVP focuses on DMs, groups, and memory integration.
- **Branding confusion**: Two products sharing auth/data could confuse users about which product to use.
  - *Mitigation*: Standalone branding with distinct color system (`agent/design/color-system.md` to be created). Cross-registration supported but products are independently branded.

---

## Dependencies

- `@prmichaelsen/remember-core` — Memory CRUD, search, spaces, relationships, ratings
- `acp-tanstack-cloudflare` — Patterns for WebSocket, auth, ACL, notifications, UI components
- Shared Firestore instance (agentbase.me)
- Shared Weaviate instance (via remember-core)
- Firebase Auth (shared with agentbase.me)
- Cloudflare Workers/Pages (deployment target)

---

## Testing Strategy

- **Unit tests**: Component rendering, service method isolation
- **Integration tests**: remember-core SDK calls against shared database
- **E2E tests**: Full chat flow (send message → save as memory → query memory → verify)
- **ACL tests**: Permission enforcement across group boundaries
- **WebSocket tests**: Connection lifecycle, reconnect behavior, multi-user message delivery

---

## Migration Path

This is a greenfield project — no migration required. Users with existing agentbase.me accounts get immediate access to their memories and groups in remember-enterprise.

---

## Key Design Decisions

### Product Identity

| Decision | Choice | Rationale |
|---|---|---|
| Product type | Standalone with own branding | Users need a clear, distinct product identity — not a "mode" of agentbase.me |
| Account requirement | Shared auth with agentbase.me, register from either product | Reduces friction while maintaining single user identity |
| Multi-tenancy | Multi-tenant SaaS or self-hosted | Enterprise flexibility, unbounded team sizes |

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Database strategy | Share same Firestore/Weaviate instance | Eliminates sync complexity, memories are immediately available |
| Memory access | Via `@prmichaelsen/remember-core` SDK | Stable API surface, never access DB directly |
| Memory scopes | Port agentbase.me pattern (personal, groups, spaces, friends) | Proven model that maps cleanly to Slack-like channels |
| Group DMs | Private groups (not a separate entity) | Simplifies data model — a group DM is just a private group with `is_discoverable: false` |

### Technical Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Framework | TanStack Start (React + Vinxi) | Consistent with reference projects (cleanbook-tanstack, agentbase.me) |
| Deployment | Cloudflare Workers/Pages | Edge performance, Durable Objects for WebSocket |
| Real-time | WebSockets via Durable Objects | Proven pattern from reference projects, low latency |
| Auth | Reuse agentbase.me's Firebase auth system | Single sign-on, shared user identity |
| ACL | Reuse agentbase.me's ACL records | Group-level + message-level permissions already built |

### UX Paradigm

| Decision | Choice | Rationale |
|---|---|---|
| MCP tool invocation | `@agent` or `/agent` in chat | Familiar Slack slash-command and mention patterns |
| Tool result rendering | Inline MessageCard (simplified) | Matches agentbase.me's MessageCard pattern, keeps chat flow unbroken |
| Memory surfacing | Dedicated Memories tab + per-message save CTA | Ports agentbase.me's tab pattern; save CTA enables frictionless memory creation |
| Navigation | Sidebar with Chat, Memories, Friends, Void, Conversations, Settings; Ghost as sub-tab within conversations | Extended beyond agentbase.me's tab pattern to cover full feature set |

### Design System

| Decision | Choice | Rationale |
|---|---|---|
| Color system | Dedicated `agent/design/color-system.md` | Standalone branding requires distinct visual identity from agentbase.me |
| Pattern library | Install `acp-tanstack-cloudflare` | 48 patterns + 39 templates covering WebSocket, auth, ACL, notifications, UI |

---

## Future Considerations

- Public channels (P3) mapped to agentbase.me public spaces
- Multiple workspaces (P10) — Slack-like org switching
- OAuth integration for third-party auth providers
- Mobile-native app (capacitator, see ~/.acp/projects/agentbase-mobile`
- Admin dashboard for workspace management
- Audit logging for enterprise compliance
- Similar/related memory carousels in chat sidebar (P1)
- Ghost (AI persona) integration for team-level AI assistants

---

**Status**: Implemented (MVP Complete)
**Last Synced**: 2026-03-16
**Related Documents**: agent/drafts/requirements.draft.md (source draft)
