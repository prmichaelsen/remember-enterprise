# Task 2: TanStack Start + Cloudflare Setup

**Milestone**: [M1 - Project Scaffolding](../../milestones/milestone-1-project-scaffolding.md)
**Design Reference**: [Requirements](../../design/local.requirements.md)
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Initialize a TanStack Start (React + Vinxi) project configured for Cloudflare Workers/Pages deployment with Tailwind CSS v4 and proper wrangler configuration including Durable Objects bindings.

---

## Steps

### 1. Initialize TanStack Start Project
- Use TanStack Start starter template or `npm create`
- Configure for Cloudflare Workers preset
- Set up TypeScript with strict mode

### 2. Configure Wrangler
- Create `wrangler.toml` with Workers/Pages config
- Add Durable Objects bindings (for WebSocket in Task 5)
- Add KV namespace bindings if needed
- Configure environment variables for Firebase credentials

### 3. Set Up Tailwind CSS v4
- Install Tailwind CSS v4
- Create `src/styles.css` with `@import 'tailwindcss'`
- Add `@theme` block with design tokens from color-system.md
- Add dark/light theme CSS variable blocks

### 4. Configure Dev Environment
- `npm run dev` works locally
- Hot reload functional
- Path aliases (`@/` → `src/`)

---

## Verification

- [ ] `npm run dev` starts without errors
- [ ] `wrangler deploy` deploys successfully (or dry-run)
- [ ] Tailwind classes render correctly
- [ ] CSS custom properties from `@theme` are available
- [ ] TypeScript compiles cleanly

---

**Next Task**: [Task 3: Color System & ThemingProvider](task-3-color-system-theming.md)
**Related Design Docs**: [Requirements](../../design/local.requirements.md), [Color System](../../design/local.color-system.md)
