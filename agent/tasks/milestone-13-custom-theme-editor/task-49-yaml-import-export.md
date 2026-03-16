# Task 49: YAML Import/Export

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 45 (theme variable config), Task 46 (editor page)
**Status**: Not Started

---

## Objective

Enable theme sharing via YAML copy/paste — export current editor state to clipboard, import pasted YAML into the editor.

---

## Steps

### 1. Install YAML parser

```bash
npm install yaml
```

Lightweight YAML parse/stringify. ~30 KB, no Node dependencies.

### 2. Create theme-yaml utilities

**File**: `src/lib/theme-yaml.ts`

```typescript
import { stringify, parse } from 'yaml'

interface ThemeYaml {
  name: string
  base: 'dark' | 'light'
  variables: Record<string, string>  // short keys → hex values
}

export function exportThemeYaml(name: string, base: 'dark' | 'light', variables: Record<string, string>): string
// Filter to only non-default values (sparse export)
// Stringify with yaml library
// Return YAML string

export function parseThemeYaml(yamlStr: string): { theme: ThemeYaml } | { error: string }
// Parse YAML string
// Validate: name (non-empty string), base ('dark' | 'light'), variables (Record)
// Validate each variable key exists in THEME_VARIABLES (via shortKey)
// Validate each value is valid hex (#xxx, #xxxxxx, #xxxxxxxx)
// Return parsed theme or error message
```

### 3. Wire Export button

In theme editor route, [Export YAML] button:
1. Call `exportThemeYaml(themeName, baseTheme, editorValues)`
2. Copy result to clipboard via `navigator.clipboard.writeText()`
3. Show 1.5s toast: "Theme YAML copied to clipboard"

### 4. Create ThemeImportModal

**File**: `src/components/settings/ThemeImportModal.tsx`

- Props: `isOpen: boolean`, `onClose: () => void`, `onImport: (theme: ThemeYaml) => void`
- Modal with title "Import Theme"
- `<textarea>` for pasting YAML (monospace font, 8-10 rows)
- Warning: "This will replace your current editor state."
- Inline error display below textarea if validation fails
- [Cancel] and [Import & Apply] buttons
- On Import: parse YAML, if valid call `onImport(theme)` and close; if error show inline

### 5. Wire Import button

In theme editor route, [Import YAML] button:
1. Opens `ThemeImportModal`
2. On import: set `themeName`, `baseTheme`, and `editorValues` from parsed theme
3. Live preview updates immediately (CSS var effect picks up new values)

---

## Verification

- [ ] [Export YAML] copies valid YAML to clipboard
- [ ] Exported YAML contains only overridden variables (sparse)
- [ ] Exported YAML uses short keys (e.g., `brand-primary` not `--color-brand-primary`)
- [ ] [Import YAML] opens modal with textarea
- [ ] Pasting valid YAML and clicking Import applies the theme to the editor
- [ ] Invalid YAML shows inline error (bad key, bad hex, missing name/base)
- [ ] Round-trip: export → paste into import → same result
- [ ] Uses `useTheme()` for modal styling
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/lib/theme-yaml.ts`
- `src/components/settings/ThemeImportModal.tsx`

**Files Modified**:
- `src/routes/settings/theme.tsx` — wire Export/Import buttons
- `package.json` — add `yaml` dependency
