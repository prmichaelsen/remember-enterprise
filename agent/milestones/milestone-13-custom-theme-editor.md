# Milestone 13: Custom Theme Editor

**Goal**: Full CSS variable editor at /settings/theme with live preview, presets, saved themes, YAML import/export, and Firestore persistence with SSR no-flash
**Duration**: 1-2 weeks
**Dependencies**: None (M12 complete, react-colorful already installed)
**Status**: Not Started

---

## Overview

Users can customize all 24 CSS design tokens (brand colors, backgrounds, text, borders) via a full-page editor at `/settings/theme`. Changes preview live. Users can save multiple named themes, load presets (Dark, Light, Midnight, Ocean, Sunset), and share themes via YAML copy/paste. Theme preferences persist in Firestore (shared with agentbase.me) and apply on SSR via cookie to avoid flash-of-default.

---

## Deliverables

### 1. Theme Variable Config & Types
- `THEME_VARIABLES` map with all 24 CSS variables grouped into 4 sections
- `PRESET_THEMES` with 5 built-in themes (dark, light, midnight, ocean, sunset)
- TypeScript types for theme data structures

### 2. Theme Editor Page
- Full page at `/settings/theme` with back navigation
- Theme name input
- Preset selector bar
- 4 collapsible variable groups (Brand, Backgrounds, Text, Borders)
- Variable rows with color swatch, hex input, and picker trigger
- Save/Export/Import buttons

### 3. Color Picker & Live Preview
- `ColorPickerPopover` using react-colorful (HexColorPicker + HexColorInput)
- `ThemeLivePreview` side panel with mock chat UI
- Inline CSS variable updates on `document.documentElement.style` for instant preview

### 4. Theme Persistence
- Extend `UserPreferences.display` in Firestore with theme data
- Cookie (`remember_theme_vars`) for SSR no-flash
- SSR injection of CSS variables on `<html>` style attribute
- Update ThemingProvider to accept custom variable overrides

### 5. YAML Import/Export
- `exportThemeYaml()` — sparse YAML with short variable keys, copies to clipboard
- `parseThemeYaml()` — validates keys/values/base, returns parsed theme
- Import modal with textarea, validation, and apply

### 6. Settings Integration
- "Customize Theme" link in `/settings` Appearance section
- Active theme name display
- Saved themes list with Load/Delete

---

## Success Criteria

- [ ] `/settings/theme` renders with all 24 variables in 4 collapsible groups
- [ ] Clicking color swatch opens react-colorful picker popover
- [ ] Typing hex values updates the variable live
- [ ] Live preview panel reflects changes instantly
- [ ] 5 preset themes load correctly (Dark, Light, Midnight, Ocean, Sunset)
- [ ] Users can name and save custom themes
- [ ] Saved themes persist across sessions (Firestore)
- [ ] Theme applies on SSR (no flash of default on page load)
- [ ] Theme is shared between remember-enterprise and agentbase.me
- [ ] Export YAML copies theme to clipboard
- [ ] Import YAML parses, validates, and applies theme
- [ ] Invalid YAML shows inline error
- [ ] `/settings` shows active theme name and "Customize Theme" link
- [ ] No new TypeScript errors
- [ ] `useTheme()` continues to work with custom overrides

---

## Tasks

1. [Task 45: Theme Variable Config & Preset Themes](../tasks/milestone-13-custom-theme-editor/task-45-theme-variable-config.md)
2. [Task 46: Theme Editor Page](../tasks/milestone-13-custom-theme-editor/task-46-theme-editor-page.md)
3. [Task 47: Color Picker & Live Preview](../tasks/milestone-13-custom-theme-editor/task-47-color-picker-live-preview.md)
4. [Task 48: Theme Persistence & SSR](../tasks/milestone-13-custom-theme-editor/task-48-theme-persistence-ssr.md)
5. [Task 49: YAML Import/Export](../tasks/milestone-13-custom-theme-editor/task-49-yaml-import-export.md)
6. [Task 50: Settings Integration](../tasks/milestone-13-custom-theme-editor/task-50-settings-integration.md)

---

**Next Milestone**: TBD
**Blockers**: None
**Notes**: react-colorful already installed from M12 color picker evaluation
