# Milestone 1: Project Scaffolding & Infrastructure

**Goal**: Establish the foundational TanStack Start app on Cloudflare with auth, theming, and real-time WebSocket infrastructure
**Duration**: 1-2 weeks
**Dependencies**: None
**Status**: Not Started

---

## Overview

This milestone creates the technical foundation for remember-enterprise. It sets up the TanStack Start project on Cloudflare Workers, implements the ThemingProvider color system, integrates Firebase auth (shared with agentbase.me), and configures Durable Objects for WebSocket real-time messaging. All subsequent milestones build on this infrastructure.

---

## Deliverables

### 1. TanStack Start Project
- Working TanStack Start app deployed to Cloudflare Workers/Pages
- Wrangler configuration with Durable Objects bindings
- Tailwind CSS v4 with `@theme` design tokens from color-system.md
- ThemingProvider context delivering class names to components

### 2. Auth Integration
- Firebase Auth shared with agentbase.me (cookie-based sessions)
- Login/logout routes
- Auth context (AuthProvider) with SSR + client sync
- Protected route middleware

### 3. WebSocket Infrastructure
- Durable Object for WebSocket connections
- WebSocket Manager (client-side auto-reconnect with exponential backoff)
- Basic message send/receive working end-to-end

### 4. Shared Package Integration
- `@prmichaelsen/agentbase-core` extracted and published (Task 1)
- `@prmichaelsen/remember-core` installed and configured

---

## Success Criteria

- [ ] `npm run dev` starts local dev server without errors
- [ ] App deploys to Cloudflare via `wrangler deploy`
- [ ] ThemingProvider renders dark theme by default, light theme via toggle
- [ ] User can log in via Firebase Auth (shared with agentbase.me)
- [ ] WebSocket connection establishes and reconnects on disconnect
- [ ] A test message can be sent and received via WebSocket

---

## Tasks

1. [Task 1: Extract @prmichaelsen/agentbase-core Package](../tasks/milestone-1-project-scaffolding/task-1-extract-agentbase-core-package.md) - Factor out shared service infrastructure
2. [Task 2: TanStack Start + Cloudflare Setup](../tasks/milestone-1-project-scaffolding/task-2-tanstack-cloudflare-setup.md) - Project init, wrangler config, Tailwind
3. [Task 3: Color System & ThemingProvider](../tasks/milestone-1-project-scaffolding/task-3-color-system-theming.md) - CSS tokens + ThemingProvider implementation
4. [Task 4: Firebase Auth Integration](../tasks/milestone-1-project-scaffolding/task-4-firebase-auth.md) - Shared auth with agentbase.me
5. [Task 5: WebSocket Durable Objects](../tasks/milestone-1-project-scaffolding/task-5-websocket-durable-objects.md) - Real-time messaging infrastructure

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| agentbase-core extraction breaks agentbase.me | High | Medium | Incremental extraction with full test pass after each step |
| Durable Objects complexity | Medium | Low | Follow acp-tanstack-cloudflare pattern exactly |
| Shared Firestore auth edge cases | Medium | Medium | Test cross-product login/logout flows early |

---

**Next Milestone**: [Milestone 2: Core Messaging](milestone-2-core-messaging.md)
**Blockers**: None
