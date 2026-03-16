# Task 39: ActionBarItem Infrastructure

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: [ActionBarItem Pattern](../../patterns/tanstack-cloudflare.action-bar-item.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 38 (inline SVG migration)
**Status**: Not Started

---

## Objective

Implement the ActionBarItem type system, ActionBar container component, Popover component, and ConfirmRenderer — the foundational infrastructure that all per-action hooks will build on.

---

## Context

The ActionBarItem pattern spec (`agent/patterns/tanstack-cloudflare.action-bar-item.md`) defines a config-driven abstraction for composable action items. This task implements the core infrastructure so subsequent tasks can create per-action hooks that plug into the container.

---

## Steps

### 1. Create ActionBarItem types

**File**: `src/types/action-bar.ts`

```typescript
import type { LucideIcon } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

export interface ActionBarItem {
  key: string
  icon: LucideIcon
  label: string
  onTrigger?: () => void
  renderContent?: (ctx: ActionBarContentContext) => ReactNode
  renderModals?: () => ReactNode
  onContentClose?: () => void
  triggerRef?: RefObject<HTMLButtonElement | null>
  loading?: boolean
  disabled?: boolean
  hidden?: boolean
  danger?: boolean
  active?: boolean
  iconClassName?: string
  suffix?: ReactNode
}

export interface ActionBarContentContext {
  close: () => void
  anchorRef: RefObject<HTMLElement | null>
}
```

### 2. Create Popover component

**File**: `src/components/action-bar/Popover.tsx`

- Renders absolutely positioned content anchored to a trigger ref
- Uses `useTheme()` for styling (`t.card`, `t.border`)
- Click-outside to close (via overlay or mousedown listener)
- Position: above the trigger by default, flip below if near top of viewport
- Accept `children`, `anchorRef`, `onClose` props

### 3. Create ActionBar container

**File**: `src/components/action-bar/ActionBar.tsx`

```typescript
interface ActionBarProps {
  items: ActionBarItem[]
  layout?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}
```

Behavior:
- Filter out items with `hidden: true`
- Manage `openKey: string | null` state — one popover at a time
- For each item, render a trigger button:
  - Icon-only button with `item.icon` (lucide-react)
  - `p-1.5 rounded` with `t.buttonGhost` styling
  - If `item.danger`, use `hover:text-brand-danger`
  - If `item.active`, use `t.active` background
  - If `item.disabled`, add `opacity-50 pointer-events-none`
  - If `item.loading`, show spinner
  - Apply `item.triggerRef` to button via ref callback
  - On click: if `renderContent` defined, toggle openKey; else call `onTrigger`
- Render Popover for the active `openKey` item
- Always render `item.renderModals?.()` for all items
- Call `item.onContentClose?.()` when popover closes
- Layout:
  - `horizontal` (default): `flex items-center gap-1`
  - `vertical`: `flex flex-col gap-1` (for overflow menu)
  - `compact`: `flex items-center gap-0.5`

### 4. Create ConfirmRenderer

**File**: `src/components/action-bar/renderers/ConfirmRenderer.tsx`

```typescript
interface ConfirmRendererProps {
  text: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  variant?: 'danger' | 'default'
  close: () => void
}
```

- Renders text + two buttons (Cancel / Confirm)
- Cancel calls `close()`
- Confirm calls `onConfirm()` then `close()`
- `variant: 'danger'` uses red confirm button
- Uses `useTheme()` for styling

---

## Verification

- [ ] `ActionBarItem` and `ActionBarContentContext` types exported from `src/types/action-bar.ts`
- [ ] `ActionBar` renders a list of icon buttons from items array
- [ ] Clicking an item with `renderContent` opens its popover
- [ ] Clicking another item closes the first popover and opens the second
- [ ] Clicking an item with `onTrigger` (no `renderContent`) calls the handler directly
- [ ] Hidden items are not rendered
- [ ] Disabled items are visually muted and non-interactive
- [ ] `ConfirmRenderer` shows text + Cancel/Confirm buttons
- [ ] Confirm button in danger variant is styled red
- [ ] Click-outside closes popover
- [ ] All components use `useTheme()` — no hardcoded colors
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/types/action-bar.ts`
- `src/components/action-bar/ActionBar.tsx`
- `src/components/action-bar/Popover.tsx`
- `src/components/action-bar/renderers/ConfirmRenderer.tsx`

---

## Key Design Decisions

### Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Content detection | Implicit (`renderContent !== undefined`) | Simpler API, no boolean flag |
| Popover orchestration | Container manages `openKey` | One-popover-at-a-time without per-hook coordination |
| Trigger ref ownership | Hook creates ref, container applies it | Simpler lifecycle, hook encapsulates everything |
| Customization | Override `renderContent` entirely | No per-prop customization; renderers compose |

---

**Next Task**: [Task 40: Toast System](task-40-toast-system.md)
