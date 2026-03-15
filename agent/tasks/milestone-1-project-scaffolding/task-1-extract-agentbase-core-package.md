# Task 1: Extract @prmichaelsen/agentbase-core Package

**Milestone**: [M1 - Project Scaffolding](../../milestones/milestone-1-project-scaffolding.md)
**Design Reference**: None
**Estimated Time**: 8-12 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Factor out reusable service infrastructure from `~/.acp/projects/agentbase.me` into a standalone `@prmichaelsen/agentbase-core` npm package, so that remember-enterprise (and future projects) can share the base service layer, database service patterns, auth utilities, and common lib modules without duplicating code.

---

## Context

agentbase.me has grown a substantial service library (~120+ service files, 18+ lib modules) with well-established patterns:

- **BaseService<TConfig>** abstract class with constructor injection, logger interface, lifecycle hooks
- **Result<T>** error handling pattern across services
- **Database service layer** (`*-database.service.ts`) separated from client-side business logic
- **Lib modules** for auth, chat, storage, email, notifications, OAuth, analytics, etc.

remember-enterprise will need many of these same patterns (auth, notifications, chat/websocket, database services). Rather than copy-paste or reinvent, extracting a shared core package enables both projects to stay in sync and reduces maintenance burden.

---

## Steps

### 1. Audit agentbase.me Services for Reusability

Review the service directory at `~/.acp/projects/agentbase.me/src/services/` and categorize each service:

- **Core/reusable**: `base.service.ts`, Result types, error classes, logger interface
- **Pattern-reusable**: Database service base patterns (CRUD abstractions), confirmation tokens, notification infrastructure
- **App-specific**: Services tightly coupled to agentbase.me domain (ghost conversations, widget boards, vision API)

Key files to evaluate:
- `src/services/base.service.ts` — abstract base class (high reuse)
- `src/services/user.service.ts` — Result pattern example (pattern reuse)
- `src/services/notification-hub.service.ts` — notification dispatch (high reuse)
- `src/services/confirmation-token.service.ts` — token pattern (high reuse)
- `src/lib/auth/` — auth utilities (high reuse)
- `src/lib/chat/` — chat provider abstractions (high reuse for remember-enterprise)
- `src/lib/storage/` — file storage abstraction (moderate reuse)
- `src/lib/email/` — email templating (moderate reuse)
- `src/lib/logger.ts` — logger implementation (high reuse)
- `src/lib/firebase-admin.ts` / `firebase-client.ts` — Firebase wrappers (high reuse)

### 2. Define Package Scope and API Surface

Decide what goes into `@prmichaelsen/agentbase-core` vs stays in agentbase.me:

**Include in core**:
- BaseService abstract class and types
- Result<T> / error handling utilities
- Logger interface and implementation
- Firebase Admin/Client SDK wrappers
- Auth session utilities
- Notification infrastructure (hub, preferences, triggers patterns)
- Confirmation token service pattern
- Database service base class / CRUD helpers
- Common lib utilities (format-time, linkify, clipboard, etc.)

**Keep in agentbase.me**:
- Domain-specific services (ghost, vision, widget, spaces)
- App-specific database services
- Algolia integration (app-specific search)
- Stripe/IAP (app-specific billing)

### 3. Create the Package Repository

- Create new repo or directory for `@prmichaelsen/agentbase-core`
- Initialize with standard TypeScript package setup (tsconfig, esbuild, vitest)
- Set up ACP with `@acp-init`
- Configure npm publishing (package.json with proper exports, types)

### 4. Extract and Refactor Core Services

- Copy identified core files into the new package
- Remove agentbase.me-specific imports and dependencies
- Generalize interfaces where needed (e.g., make Firebase optional via dependency injection)
- Ensure BaseService, Result types, and logger work standalone
- Add proper TypeScript exports via index.ts barrel file

### 5. Update agentbase.me to Consume the Package

- Install `@prmichaelsen/agentbase-core` in agentbase.me
- Replace local imports with package imports
- Verify all existing tests pass
- Ensure no behavior changes

### 6. Wire Up remember-enterprise

- Install `@prmichaelsen/agentbase-core` in remember-enterprise
- Extend BaseService for remember-enterprise's service layer
- Use shared auth, notification, and database patterns

---

## Verification

- [ ] `@prmichaelsen/agentbase-core` package builds and publishes to npm
- [ ] BaseService, Result types, and logger export correctly
- [ ] Firebase wrappers export and work with dependency injection
- [ ] Auth utilities export and work standalone
- [ ] agentbase.me tests pass after switching to package imports
- [ ] remember-enterprise can import and extend BaseService
- [ ] No circular dependencies in the package
- [ ] Package has proper TypeScript types (declaration files)

---

## Expected Output

**New package structure**:
```
@prmichaelsen/agentbase-core/
├── src/
│   ├── services/
│   │   ├── base.service.ts
│   │   ├── types.ts (Result, errors)
│   │   └── index.ts
│   ├── lib/
│   │   ├── auth/
│   │   ├── firebase-admin.ts
│   │   ├── firebase-client.ts
│   │   ├── logger.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── AGENT.md
```

---

## Key Design Decisions

### Package Scope

| Decision | Choice | Rationale |
|---|---|---|
| What to extract | Base services, Result types, auth, Firebase wrappers, logger, common utils | These are domain-agnostic and used across multiple projects |
| What to leave | Domain services (ghost, vision, widgets, billing) | Tightly coupled to agentbase.me's specific features |
| Dependency injection | Firebase and external deps via constructor injection | Keeps core package lightweight; consumers provide their own Firebase instances |
| Publishing | npm under @prmichaelsen scope | Consistent with existing package naming |

---

## Notes

- This is a refactoring/extraction task — no new features, just reorganization
- agentbase.me should have zero behavior changes after extraction
- Start with the smallest viable extraction (BaseService + Result + logger) and expand
- Consider whether chat provider abstractions should be in core or a separate `@prmichaelsen/agentbase-chat` package
- The `library-services` pattern from tanstack-cloudflare package may inform the service architecture

---

**Next Task**: TBD
**Related Design Docs**: None yet
**Estimated Completion Date**: TBD
