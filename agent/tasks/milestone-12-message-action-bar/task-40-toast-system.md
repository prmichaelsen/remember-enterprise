# Task 40: Toast System

**Milestone**: [M12 - Message Action Bar](../../milestones/milestone-12-message-action-bar.md)
**Design Reference**: None
**Estimated Time**: 1-2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create a lightweight toast notification system with 1.5s auto-dismiss for action feedback (e.g., "Copied!", "Saved to memory").

---

## Context

The message action bar needs fast visual feedback for non-destructive actions. The user specified 1.5-second toasts. This is a general-purpose system that can be used across the app.

---

## Steps

### 1. Create Toast component

**File**: `src/components/ui/Toast.tsx`

- Renders a small notification pill at the bottom-center of the viewport
- Props: `message: string`, `variant?: 'success' | 'error' | 'info'`, `onDismiss: () => void`
- Uses `useTheme()` for styling
- Animate in (slide up + fade in) and out (fade out)
- Fixed positioning: `fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]`
  - `bottom-20` to clear MobileBottomNav on mobile
- Small pill: `px-4 py-2 rounded-full text-sm shadow-lg`
- Variant colors via theme tokens

### 2. Create ToastProvider context

**File**: `src/components/ui/ToastProvider.tsx`

```typescript
interface ToastOptions {
  message: string
  variant?: 'success' | 'error' | 'info'
  duration?: number // default 1500ms
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}
```

- Manages a queue of toasts (show one at a time)
- Auto-dismiss after `duration` ms (default 1500)
- Renders Toast component via portal
- Export `useToast()` hook

### 3. Wire ToastProvider into app

- Add `<ToastProvider>` inside `AppShell` or root layout (wrapping `<Outlet />`)
- Ensure it renders above other content (z-index 60)

---

## Verification

- [ ] `useToast()` hook is available from any component inside AppShell
- [ ] `showToast({ message: 'Copied!' })` renders a toast at bottom-center
- [ ] Toast auto-dismisses after 1.5 seconds
- [ ] Custom duration works (e.g., `duration: 3000`)
- [ ] Error variant shows distinct styling
- [ ] Toast doesn't overlap MobileBottomNav
- [ ] Multiple rapid calls queue correctly (one at a time)
- [ ] Uses `useTheme()` — no hardcoded colors
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastProvider.tsx`

**Files Modified**:
- Root layout or AppShell (add `<ToastProvider>`)

---

**Next Task**: [Task 41: Core Action Hooks](task-41-core-action-hooks.md)
