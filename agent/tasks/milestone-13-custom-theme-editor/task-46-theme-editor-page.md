# Task 46: Theme Editor Page

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 4-6 hours
**Dependencies**: Task 45 (theme variable config)
**Status**: Not Started

---

## Objective

Create the full-page theme editor at `/settings/theme` with variable groups, preset bar, theme name input, and saved themes list.

---

## Steps

### 1. Create ThemeVariableRow component

**File**: `src/components/settings/ThemeVariableRow.tsx`

- Props: `variable: ThemeVariable`, `value: string`, `onChange: (key: string, value: string) => void`, `onPickerOpen: (key: string) => void`
- Renders: label, color swatch (10x10 rounded div with bg), hex input (editable), picker trigger button (Palette icon from lucide-react)
- Hex input validates on blur (must be valid hex)
- Uses `useTheme()` for styling

### 2. Create ThemeVariableGroup component

**File**: `src/components/settings/ThemeVariableGroup.tsx`

- Props: `group: ThemeVariableGroup`, `variables: ThemeVariable[]`, `values: Record<string, string>`, `onChange`, `onPickerOpen`
- Collapsible section with chevron toggle
- Group title and description from `THEME_VARIABLE_GROUPS`
- Renders `ThemeVariableRow` for each variable
- Default: expanded

### 3. Create ThemePresetBar component

**File**: `src/components/settings/ThemePresetBar.tsx`

- Props: `activePreset: string | null`, `onSelect: (presetName: string) => void`
- Horizontal scrollable bar of preset buttons
- Each button shows preset name, active state via `t.active`
- Includes "+ New" button that clears to empty state

### 4. Create ThemeSavedList component

**File**: `src/components/settings/ThemeSavedList.tsx`

- Props: `themes: Record<string, CustomTheme>`, `activeId: string | null`, `onLoad: (id: string) => void`, `onDelete: (id: string) => void`
- List of saved custom themes with Load and Delete buttons
- Delete uses ConfirmRenderer popover from ActionBar system
- Empty state: "No saved themes yet"

### 5. Create theme editor route

**File**: `src/routes/settings/theme.tsx`

- Route: `createFileRoute('/settings/theme')`
- Full page layout with back link to `/settings`
- Theme name input at top
- `ThemePresetBar`
- 4 `ThemeVariableGroup` sections (brand, backgrounds, text, borders)
- `ThemeSavedList` at bottom
- Footer buttons: [Save Theme] [Export YAML] [Import YAML]
- State: `editorValues: Record<string, string>` — all 24 current values
- State: `themeName: string`
- State: `baseTheme: 'dark' | 'light'`
- Loading a preset or saved theme replaces all editor values
- Uses `useTheme()` for page styling

---

## Verification

- [ ] `/settings/theme` renders with all 24 variables in 4 groups
- [ ] Variable groups collapse and expand
- [ ] Hex input updates the value on blur
- [ ] Color swatch reflects current value
- [ ] Preset bar shows 5 presets + New
- [ ] Clicking a preset loads its values into the editor
- [ ] Saved themes list renders with Load/Delete
- [ ] Theme name input is editable
- [ ] Uses `useTheme()` — no hardcoded colors
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/routes/settings/theme.tsx`
- `src/components/settings/ThemeVariableRow.tsx`
- `src/components/settings/ThemeVariableGroup.tsx`
- `src/components/settings/ThemePresetBar.tsx`
- `src/components/settings/ThemeSavedList.tsx`
