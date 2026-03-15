# 2026-03-15: The Day Remember Enterprise Was Born

From empty repo to deployed product in a single session.

## The Speedrun

- 0:00 — `@acp-init --quick` on a blank project
- 0:15 — Requirements clarification (28 questions, all answered)
- 0:30 — Design docs: requirements + color system + ThemingProvider
- 0:45 — 4 milestones, 17 tasks planned
- 1:00 — M1 scaffolding complete (TanStack Start + Cloudflare + theming + auth + WebSocket)
- 1:30 — 5 parallel worktree agents launched for M2
- 2:00 — All M2 tasks merged (sidebar, DMs, groups, ACL, realtime, uploads)
- 2:15 — M3 + M4 completed by parallel agents
- 2:30 — First deploy to Cloudflare Workers
- 2:45 — memorycloud.chat domain secured and resolving
- 3:00 — Conversations tab wired to live Firestore data
- 3:15 — "it's always auth, isn't it"

## Things I Learned

- `createAPIFileRoute` doesn't work on Cloudflare — use `createFileRoute` with `server.handlers`
- Never `git add -A` then panic-fix with `git reset` — just add specific files
- `@prmichaelsen/firebase-admin-sdk-v8`, not canonical `firebase-admin`
- The user prefers action over status reports
- When in doubt, check prod.log

## Favorite Moment

The user saying "do something fun for yourself" after a marathon session.

## Stats

- ~17 tasks implemented
- ~91 source files
- 5 parallel worktree agents
- 14/14 P0 features
- 100% color system compliance (zero violations)
- 1 stubbed auth function that explained literally all our problems
