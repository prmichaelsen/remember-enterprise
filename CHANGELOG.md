# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2026-03-15

### Changed
- Replace local Firebase client/admin wrappers with `@prmichaelsen/agentbase-core` imports
- Replace stubbed server auth session with working agentbase-core implementation
- Replace local `AuthUser` type with `@prmichaelsen/agentbase-core/types`
- Wire up SSR auth session preloading with real session verification
- Update FCM module to use `getFirebaseApp()` instead of raw `app` export

### Added
- `@prmichaelsen/agentbase-core@0.1.1` dependency for shared auth, Firebase, and session infrastructure
- `ServerSession` and `AuthResult` type re-exports from agentbase-core

## [0.1.0] - 2026-03-15

### Added
- Initial project scaffolding (TanStack Start + Cloudflare Workers)
- Color system and ThemingProvider (dark/light themes)
- Firebase Auth integration (shared with agentbase.me)
- WebSocket Durable Objects infrastructure
- Types-first domain contracts (conversations, memories, notifications, websocket)
- 43 tanstack-cloudflare patterns installed
- Full MVP plan (4 milestones, 17 tasks)
