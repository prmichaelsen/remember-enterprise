# Task 83: Resizable Thread Panel via Drag

**Milestone**: [M16 - Threaded Replies](../../milestones/milestone-16-threaded-replies.md)
**Design Reference**: [Threaded Replies](../../design/local.threaded-replies.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 75 (ThreadPanel Component)
**Status**: Not Started

---

## Objective

Add a drag-to-resize handle on the left border of the ThreadPanel, allowing desktop users to adjust the panel width by dragging. Persist the width preference in localStorage.

---

## Context

The ThreadPanel currently has a fixed width of `md:w-[500px]`. Users may want wider or narrower panels depending on content and screen size. A drag handle on the left border (the divider between main chat and thread panel) provides intuitive resizing — matching the pattern used by VS Code split panels, Slack thread sidebar, and browser DevTools.

This is a desktop-only feature (mobile uses full-screen view).

---

## Steps

### 1. Add Resize State and Drag Logic

Add resize state and mouse event handlers to `src/components/threads/ThreadPanel.tsx`:

```typescript
const MIN_WIDTH = 320   // px — minimum usable width
const MAX_WIDTH = 800   // px — don't exceed ~60% of viewport
const DEFAULT_WIDTH = 500
const STORAGE_KEY = 'thread-panel-width'

function getStoredWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed
    }
  } catch {}
  return DEFAULT_WIDTH
}

// Inside ThreadPanel component:
const [panelWidth, setPanelWidth] = useState(getStoredWidth)
const isResizing = useRef(false)

useEffect(() => {
  function handleMouseMove(e: MouseEvent) {
    if (!isResizing.current) return
    // Width = viewport width - mouse X position
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX))
    setPanelWidth(newWidth)
  }

  function handleMouseUp() {
    if (isResizing.current) {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Persist width
      localStorage.setItem(STORAGE_KEY, String(panelWidth))
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}, [panelWidth])

function handleResizeStart(e: React.MouseEvent) {
  e.preventDefault()
  isResizing.current = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}
```

### 2. Replace Fixed Width with Dynamic Width

Change the panel container from fixed `md:w-[500px]` to dynamic width:

```tsx
<div
  className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 bg-background flex flex-col z-50 md:border-l md:border-border"
  style={{ width: undefined }} // Mobile: full width via inset-0
  // Apply dynamic width on desktop only via media query or inline style
>
```

Use a style object for desktop width:

```tsx
style={{
  // Only apply custom width on desktop (md breakpoint = 768px)
  ...(typeof window !== 'undefined' && window.innerWidth >= 768
    ? { width: `${panelWidth}px` }
    : {})
}}
```

Or better — keep `inset-0` for mobile and override width on desktop via className + style:

```tsx
className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 bg-background flex flex-col z-50 md:border-l md:border-border"
style={{ '--thread-panel-width': `${panelWidth}px` } as React.CSSProperties}
// Then in className: remove md:w-[500px], add a custom class or inline md style
```

Simplest approach: apply `width` via inline style and let mobile CSS (`inset-0`) override:

```tsx
<div
  className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 bg-background flex flex-col z-50 md:border-l md:border-border"
  style={{ width: window.innerWidth >= 768 ? `${panelWidth}px` : undefined }}
>
```

### 3. Add Drag Handle Element

Add a drag handle on the left border of the panel (desktop only):

```tsx
{/* Drag handle — desktop only */}
<div
  className="hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-10"
  onMouseDown={handleResizeStart}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize thread panel"
  aria-valuenow={panelWidth}
  aria-valuemin={MIN_WIDTH}
  aria-valuemax={MAX_WIDTH}
/>
```

### 4. Adjust Main Chat Layout

Update `src/routes/chat/$conversationId.tsx` to shrink the main chat area when the thread panel is open on desktop. Pass `panelWidth` from ThreadPanel state (or lift it up):

```tsx
// Main chat container
<div
  className="flex-1"
  style={{
    marginRight: openThread && window.innerWidth >= 768 ? `${panelWidth}px` : undefined
  }}
>
  {/* existing chat content */}
</div>
```

Alternatively, the ThreadPanel can use `position: fixed` (current approach), which overlays rather than pushing content. If overlay is acceptable, no main chat changes needed.

### 5. Persist Width in localStorage

Already handled in step 1 — width saved on `mouseup`, restored on component mount via `getStoredWidth()`.

---

## Verification

- [ ] Drag handle visible on left border of ThreadPanel (desktop only)
- [ ] Dragging left/right resizes the panel width
- [ ] Panel respects MIN_WIDTH (320px) and MAX_WIDTH (800px) bounds
- [ ] Width persists across page reloads (localStorage)
- [ ] Cursor changes to `col-resize` during drag
- [ ] Text selection disabled during drag (no accidental selection)
- [ ] Mobile view unaffected (still full-screen, no drag handle)
- [ ] Drag does not interfere with Virtuoso scrolling inside the panel
- [ ] ARIA attributes present on drag handle (separator role)
- [ ] TypeScript compilation passes

---

## Output

### Files Modified
- `src/components/threads/ThreadPanel.tsx` — Added resize state, drag handle, dynamic width, localStorage persistence

### Files Created
- None

---

## Notes

- **Overlay vs Push**: Current ThreadPanel uses `position: fixed` which overlays the main chat. This means resizing only affects the thread panel width, not the main chat layout. If we switch to push layout later, the main chat area would need `marginRight` adjustment.
- **Touch Support**: Drag resize is desktop-only. Mobile already uses full-screen. Touch-based resize could be added later if tablet users request it.
- **Double-Click Reset**: Consider adding double-click on drag handle to reset to default width (500px). This is a nice-to-have polish item.
- **SSR Safety**: `window.innerWidth` and `localStorage` must be guarded against SSR. Use `typeof window !== 'undefined'` checks or `useEffect` for initialization.

---

## Related Tasks
- **Depends on**: [Task 75: ThreadPanel Component](task-75-threadpanel-component.md)
- **Related**: [Task 78: Mobile Full-Screen View](task-78-mobile-fullscreen-view.md)
