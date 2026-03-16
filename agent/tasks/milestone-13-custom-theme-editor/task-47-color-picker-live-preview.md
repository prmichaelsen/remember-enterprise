# Task 47: Color Picker & Live Preview

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 45, Task 46
**Status**: Not Started

---

## Objective

Add the react-colorful color picker popover and a live preview panel that updates in real-time as variables change.

---

## Steps

### 1. Create ColorPickerPopover

**File**: `src/components/settings/ColorPickerPopover.tsx`

- Props: `color: string`, `onChange: (color: string) => void`, `anchorRef: RefObject<HTMLElement | null>`, `onClose: () => void`
- Uses existing `Popover` component from `@/components/action-bar/Popover`
- Content: `HexColorPicker` + `HexColorInput` from react-colorful
- Color swatch preview inside popover
- Uses `useTheme()` for popover card styling

### 2. Wire picker into ThemeVariableRow

- When picker trigger (Palette icon) is clicked, open `ColorPickerPopover`
- Picker anchored to the trigger button
- On color change from picker, update editor value and apply CSS var live
- One picker at a time (close previous when opening new)

### 3. Add live CSS variable application

In the theme editor route, add an effect that applies editor values to `document.documentElement.style`:

```typescript
useEffect(() => {
  for (const [shortKey, value] of Object.entries(editorValues)) {
    const cssVar = shortKeyToCssVar(shortKey)
    document.documentElement.style.setProperty(cssVar, value)
  }
  // Cleanup: remove overrides when leaving the page
  return () => {
    for (const shortKey of Object.keys(editorValues)) {
      const cssVar = shortKeyToCssVar(shortKey)
      document.documentElement.style.removeProperty(cssVar)
    }
  }
}, [editorValues])
```

This makes the entire app preview the theme live — every component using theme tokens updates instantly.

### 4. Create ThemeLivePreview panel

**File**: `src/components/settings/ThemeLivePreview.tsx`

- Rendered to the right of the editor on desktop (side panel), hidden on mobile (the whole app IS the preview)
- Contains a miniature mock UI showing:
  - Header bar with "Memory Cloud" branding
  - Sidebar nav items (Chat, Memories)
  - Two chat messages (user + agent)
  - Compose input
  - A button in primary color
  - A card with border
- All elements use CSS variable token classes (e.g., `bg-bg-page`, `text-text-primary`, `border-border-default`)
- Since we're applying CSS vars on documentElement, this panel naturally reflects the live theme
- Wrap in a fixed-height scrollable container

### 5. Desktop layout

Update theme editor route to use a two-column layout on `lg:` screens:
- Left: scrollable editor (variable groups, presets, saved themes, buttons)
- Right: sticky live preview panel

---

## Verification

- [ ] Clicking Palette icon opens react-colorful picker
- [ ] Picker shows current color and updates on interaction
- [ ] HexColorInput inside picker accepts typed hex values
- [ ] Changing a color updates the swatch, hex input, and live preview simultaneously
- [ ] Only one picker open at a time
- [ ] Live preview panel shows mock UI with current theme
- [ ] Desktop: two-column layout (editor + preview)
- [ ] Mobile: preview hidden (whole app previews live)
- [ ] Leaving `/settings/theme` removes CSS var overrides (restores previous theme)
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/components/settings/ColorPickerPopover.tsx`
- `src/components/settings/ThemeLivePreview.tsx`

**Files Modified**:
- `src/components/settings/ThemeVariableRow.tsx` — wire picker trigger
- `src/routes/settings/theme.tsx` — add live CSS var effect + two-column layout
