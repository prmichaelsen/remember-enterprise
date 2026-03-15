# Task 3: Color System & ThemingProvider

**Milestone**: [M1 - Project Scaffolding](../../milestones/milestone-1-project-scaffolding.md)
**Design Reference**: [Color System](../../design/local.color-system.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 2
**Status**: Not Started

---

## Objective

Implement the two-layer theming system: CSS custom properties for design tokens and a React ThemingProvider that delivers pre-composed class name strings to components.

---

## Steps

### 1. Implement CSS Tokens
- Add palette colors (brand-primary, brand-secondary, etc.) to `@theme` block
- Add dark theme contextual tokens in `:root, [data-theme="dark"]`
- Add light theme contextual tokens in `[data-theme="light"]`

### 2. Create ThemingProvider
- Implement `src/lib/theming.tsx` with Theme interface (30+ keys)
- Create darkTheme and lightTheme objects with pre-composed Tailwind class strings
- Export ThemingProvider component and useTheme hook
- ThemingProvider sets `data-theme` attribute on wrapper div

### 3. Wire Into App Root
- Wrap app in ThemingProvider in root layout
- Default to dark theme
- Verify theme switching works

### 4. Create Example Component
- Build a simple test component using `useTheme()` to validate pattern
- Verify Tailwind purges correctly (all class strings found in theme objects)

---

## Verification

- [ ] `useTheme()` returns typed Theme object
- [ ] Dark theme renders correct colors
- [ ] Light theme renders correct colors when switched
- [ ] No raw Tailwind color classes in example component
- [ ] Tailwind includes all theme class strings in build output

---

**Next Task**: [Task 4: Firebase Auth Integration](task-4-firebase-auth.md)
**Related Design Docs**: [Color System](../../design/local.color-system.md)
