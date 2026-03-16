# Task 48: Theme Persistence & SSR

**Milestone**: [M13 - Custom Theme Editor](../../milestones/milestone-13-custom-theme-editor.md)
**Design Reference**: [Custom Theme Editor](../../design/local.custom-theme-editor.md)
**Estimated Time**: 4-6 hours
**Dependencies**: Task 45, Task 46
**Status**: Not Started

---

## Objective

Persist custom themes to Firestore (shared with agentbase.me), apply themes on SSR via cookie to avoid flash-of-default, and update the ThemingProvider to support custom variable overrides.

---

## Steps

### 1. Create theme persistence helpers

**File**: `src/lib/theme-persistence.ts`

```typescript
// Cookie helpers
function setThemeCookie(variables: Record<string, string>): void
function getThemeCookie(): Record<string, string> | null
function clearThemeCookie(): void

// Firestore helpers (client-side, call API routes)
async function saveThemePreferences(prefs: ThemePreferences): Promise<void>
async function loadThemePreferences(): Promise<ThemePreferences | null>
```

- Cookie name: `remember_theme_vars`
- Cookie value: compact JSON of `{ [cssVar]: hexValue }` — only overrides
- Cookie max-age: 1 year, path: `/`, SameSite: Lax
- Firestore: call existing preferences API at `/api/preferences` (or create if needed)

### 2. Create/update preferences API route

Check if `/api/preferences` exists. If not, create it:

**File**: `src/routes/api/preferences.tsx` (if needed)

- `GET` — returns user's `ThemePreferences` from Firestore
- `PATCH` — merges theme preferences into user's preferences doc
- Auth guard with `getServerSession`
- Uses `PreferencesDatabaseService` or direct Firestore read/write at `agentbase.users/{userId}/preferences`

### 3. Wire Save Theme in editor

In the theme editor route, the [Save Theme] button:
1. Generates a UUID for new themes (or reuses existing ID for updates)
2. Builds a `CustomTheme` from current editor state (sparse — only overrides vs base defaults)
3. Calls `saveThemePreferences()` to write to Firestore
4. Sets cookie with `setThemeCookie()`
5. Updates `localStorage.setItem('remember_theme', activeThemeId)`
6. Shows 1.5s toast: "Theme saved"

### 4. Update root route for SSR no-flash

**File**: `src/routes/__root.tsx`

In `beforeLoad`:
- Parse `remember_theme_vars` cookie from the request
- If cookie has overrides, pass them as `themeOverrides` in route context

In `RootDocument`:
- If `themeOverrides` present, inject as inline `style` on `<html>`:
  ```html
  <html style="--color-brand-primary:#818CF8;--color-bg-page:#020617;...">
  ```

### 5. Update ThemingProvider

**File**: `src/lib/theming.tsx`

- Accept optional `customVariables?: Record<string, string>` prop
- On mount, apply custom variables to `document.documentElement.style`
- On theme change, update the CSS variables
- Preserve existing dark/light theme object selection

### 6. Load saved theme on app start

In root layout or AppShell:
- On mount, if user is authenticated, fetch `ThemePreferences` from API
- If active theme is a custom theme, apply its variables
- If active theme is a preset, apply preset variables
- Update cookie to match loaded theme (keeps SSR in sync)

---

## Verification

- [ ] [Save Theme] writes to Firestore and sets cookie
- [ ] Refreshing the page applies the saved theme without flash
- [ ] Theme persists across sessions and devices (Firestore sync)
- [ ] Cookie contains only overridden variables (sparse)
- [ ] SSR renders correct CSS variables on `<html>` tag
- [ ] ThemingProvider applies custom variables on mount
- [ ] Switching between preset and custom themes works
- [ ] Signing out clears theme cookie
- [ ] No flash of default theme on page load
- [ ] No TypeScript errors

---

## Expected Output

**Files Created**:
- `src/lib/theme-persistence.ts`
- `src/routes/api/preferences.tsx` (if needed)

**Files Modified**:
- `src/routes/__root.tsx` — cookie parsing + CSS var injection in SSR
- `src/lib/theming.tsx` — custom variable support
- `src/routes/settings/theme.tsx` — wire Save button
