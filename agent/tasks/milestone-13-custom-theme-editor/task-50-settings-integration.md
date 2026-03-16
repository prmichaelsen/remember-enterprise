# Task 50: Settings Integration

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 1-2 hours
**Dependencies**: Task 46 (editor page), Task 48 (persistence)
**Status**: Not Started

---

## Objective

Update the `/settings` page Appearance section to show the active theme name and link to the full theme editor.

---

## Steps

### 1. Update Appearance section in /settings

**File**: `src/routes/settings/index.tsx`

In the existing Appearance section (after the Dark/Light toggle buttons), add:
- Active theme name display: "Active: {themeName} (custom)" or "Active: Dark (preset)"
- "Customize Theme" link that navigates to `/settings/theme`
- Style the link as a button or text link with arrow: `[Customize Theme →]`

### 2. Read active theme on settings page

- Read from localStorage (`remember_theme`) or cookie to determine active theme
- If it's a preset name (dark/light/midnight/ocean/sunset), show the preset name
- If it's a custom ID, show the custom theme's name
- Use the same `loadThemePreferences()` helper from Task 48

### 3. Quick theme switching

The Dark/Light toggle buttons should continue to work for quick switching:
- Clicking Dark/Light sets the base theme immediately
- If user has a custom theme active, switching to Dark/Light reverts to the preset (clears custom overrides)
- Updates cookie + localStorage

---

## Verification

- [ ] Appearance section shows active theme name
- [ ] "Customize Theme" link navigates to `/settings/theme`
- [ ] Dark/Light toggle still works for quick switching
- [ ] Switching from custom → preset clears custom overrides
- [ ] Theme name updates when a custom theme is saved
- [ ] No TypeScript errors

---

## Expected Output

**Files Modified**:
- `src/routes/settings/index.tsx` — updated Appearance section
