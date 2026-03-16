# Task 38: Migrate Inline SVGs to Lucide-React Icons

**Milestone**: Unassigned
**Design Reference**: None
**Estimated Time**: 1 hour
**Dependencies**: None
**Status**: Not Started

---

## Objective

Replace all inline `<svg>` elements in the codebase with equivalent `lucide-react` icon components to ensure consistent icon usage across the project.

---

## Context

The project already uses `lucide-react` as its standard icon library. Three files still contain hand-written inline SVGs instead of lucide-react components. This creates visual inconsistency and maintenance burden. This cleanup is a prerequisite for the Message Action Bar feature (clarification-2), which will rebuild the Message.tsx action bar using the ActionBarItem pattern with lucide-react icons.

---

## Steps

### 1. Replace inline SVGs in `src/components/chat/Message.tsx`

The message action bar (lines 117-171) contains four inline SVG icons. Replace each with the lucide-react equivalent:

| Action | Current SVG | Lucide Icon |
|---|---|---|
| Copy message | Clipboard/copy path | `Copy` |
| Regenerate | Refresh/rotate path | `RefreshCw` |
| Edit message | Pencil/edit path | `Pencil` |
| Delete message | Trash path | `Trash2` |

- Add imports: `import { Copy, RefreshCw, Pencil, Trash2 } from 'lucide-react'`
- Replace each `<svg>...</svg>` block with `<Copy className="w-4 h-4" />` etc.
- Preserve all existing `onClick`, `className` (on the button wrapper), `title`, and `aria-label` attributes

### 2. Replace inline SVGs in `src/components/media/PhotoUpload.tsx`

Audit the file for inline SVGs and replace with lucide-react equivalents. Common candidates:
- Upload icon → `Upload` or `ImagePlus`
- Camera icon → `Camera`
- Close/X icon → `X`

### 3. Replace inline SVGs in `src/components/media/PhotoGallery.tsx`

Audit the file for inline SVGs and replace with lucide-react equivalents. Common candidates:
- Expand/fullscreen → `Maximize2`
- Navigation arrows → `ChevronLeft`, `ChevronRight`
- Close → `X`

### 4. Verify no remaining inline SVGs

Search the codebase for any remaining `<svg` tags in `.tsx` files (excluding node_modules). There should be zero results.

---

## Verification

- [ ] No `<svg` elements remain in `src/components/chat/Message.tsx`
- [ ] No `<svg` elements remain in `src/components/media/PhotoUpload.tsx`
- [ ] No `<svg` elements remain in `src/components/media/PhotoGallery.tsx`
- [ ] `grep -r '<svg' src/ --include='*.tsx'` returns zero results
- [ ] All replaced icons render at the same size (w-4 h-4) as the originals
- [ ] Message action buttons still function correctly (copy, edit, delete)
- [ ] No new TypeScript errors introduced

---

## Expected Output

**Files Modified**:
- `src/components/chat/Message.tsx` — 4 inline SVGs → lucide-react icons
- `src/components/media/PhotoUpload.tsx` — inline SVGs → lucide-react icons
- `src/components/media/PhotoGallery.tsx` — inline SVGs → lucide-react icons

---

## Key Design Decisions

### Icon Consistency

| Decision | Choice | Rationale |
|---|---|---|
| Icon library | lucide-react exclusively | Already the project standard; inline SVGs are legacy debt |
| Icon sizing | Preserve existing w-4 h-4 | Maintains visual consistency with current layout |

---

## Notes

- This task is a cleanup/refactoring — no behavior changes
- The Message.tsx action bar will be fully rebuilt in the Message Action Bar feature, but this migration ensures consistency in PhotoUpload and PhotoGallery regardless
- lucide-react is already installed as a dependency

---

**Related**: [clarification-2-message-action-bar.md](../../clarifications/clarification-2-message-action-bar.md)
