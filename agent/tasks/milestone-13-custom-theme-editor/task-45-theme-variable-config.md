# Task 45: Theme Variable Config & Preset Themes

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Create the theme variable configuration map, preset theme definitions, and TypeScript types that the entire theme editor system builds on.

---

## Steps

### 1. Create theme variable types

**File**: `src/types/theme-editor.ts`

```typescript
export interface ThemeVariable {
  key: string           // CSS var name: '--color-brand-primary'
  shortKey: string      // YAML key: 'brand-primary'
  label: string         // Display: 'Primary'
  group: ThemeVariableGroup
  default: { dark: string; light: string }
}

export type ThemeVariableGroup = 'brand' | 'backgrounds' | 'text' | 'borders'

export interface CustomTheme {
  name: string
  base: 'dark' | 'light'
  variables: Record<string, string>  // shortKey → hex value (sparse overrides only)
}

export interface ThemePreferences {
  active_theme: string  // preset name or custom theme ID
  custom_themes: Record<string, CustomTheme>
}
```

### 2. Create theme variables map

**File**: `src/lib/theme-variables.ts`

Define `THEME_VARIABLES` — array of all 24 `ThemeVariable` objects grouped into 4 sections. Include both the full CSS var key and the short YAML key. See design doc for the complete list.

Export `THEME_VARIABLE_GROUPS` — metadata for each group (label, description).

Export helper: `cssVarToShortKey(cssVar)` and `shortKeyToCssVar(shortKey)`.

### 3. Create preset themes

**File**: `src/lib/theme-presets.ts`

Define `PRESET_THEMES` — 5 preset themes (dark, light, midnight, ocean, sunset). Each is a `Record<string, string>` mapping short keys to hex values.

- `dark` and `light`: full 24-variable definitions matching existing `styles.css` values
- `midnight`: deeper dark with saturated purples (#020617 page, #818CF8 primary)
- `ocean`: blue-tinted palette (#0C1222 page, #0EA5E9 primary, #06B6D4 accent)
- `sunset`: warm orange/amber (#1C1213 page, #F97316 primary, #EAB308 accent)

---

## Verification

- [ ] `ThemeVariable`, `CustomTheme`, `ThemePreferences` types exported
- [ ] `THEME_VARIABLES` contains all 24 variables with correct defaults matching `styles.css`
- [ ] `THEME_VARIABLE_GROUPS` has metadata for all 4 groups
- [ ] `PRESET_THEMES` has 5 themes with valid hex values
- [ ] `cssVarToShortKey` and `shortKeyToCssVar` convert correctly
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/types/theme-editor.ts`
- `src/lib/theme-variables.ts`
- `src/lib/theme-presets.ts`
