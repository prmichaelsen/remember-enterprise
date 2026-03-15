# Color System & Theming

**Concept**: Themeable design token system with a ThemingProvider that delivers class names to components, enabling runtime theme switching without component changes
**Created**: 2026-03-15
**Status**: Design Specification

---

## Overview

Remember Enterprise uses a two-layer color system inspired by cleanbook-tanstack's `@theme` CSS custom properties pattern, extended with a React `ThemingProvider` that delivers pre-composed class name strings to components. Components never reference colors directly — they consume class names from the theme context, making theme switching a single context update with zero component changes.

---

## Problem Statement

- Components that hardcode Tailwind classes (`bg-gray-900`, `text-white`) cannot be themed without modifying every file
- cleanbook-tanstack's CSS variable approach works for colors but doesn't cover composed styles (e.g., `bg-primary/15 text-primary border border-primary/30`)
- agentbase.me and acp-tanstack-cloudflare both use inline hardcoded Tailwind classes with no theming capability
- Remember Enterprise needs dark mode (Slack-like) from day one, with potential for custom workspace themes later

---

## Solution

### Layer 1: CSS Custom Properties (Design Tokens)

Define color primitives and contextual tokens as CSS variables, applied via Tailwind's `@theme` directive. This is the same pattern as cleanbook-tanstack but with a dark-first palette.

### Layer 2: ThemingProvider (Class Name Delivery)

A React context provider that maps semantic component roles to pre-composed Tailwind class strings. Components destructure the theme object to get their class names, never constructing color classes themselves.

---

## Implementation

### CSS Tokens (`src/styles.css`)

```css
@import 'tailwindcss';

@theme {
  /* Palette colors — constant across all themes */
  --color-brand-primary: #7C3AED;
  --color-brand-secondary: #2563EB;
  --color-brand-accent: #06B6D4;
  --color-brand-success: #22C55E;
  --color-brand-warning: #F59E0B;
  --color-brand-danger: #EF4444;
  --color-brand-info: #3B82F6;
}

/* Dark theme (default) */
:root, [data-theme="dark"] {
  --color-bg-page: #0F172A;
  --color-bg-card: #1E293B;
  --color-bg-sidebar: #0F172A;
  --color-bg-elevated: #334155;
  --color-bg-hover: #334155;
  --color-bg-active: #475569;
  --color-bg-input: #1E293B;
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-text-inverse: #0F172A;
  --color-border-default: #334155;
  --color-border-subtle: #1E293B;
  --color-border-strong: #475569;
}

/* Light theme */
[data-theme="light"] {
  --color-bg-page: #FFFFFF;
  --color-bg-card: #FFFFFF;
  --color-bg-sidebar: #F8FAFC;
  --color-bg-elevated: #F1F5F9;
  --color-bg-hover: #F1F5F9;
  --color-bg-active: #E2E8F0;
  --color-bg-input: #FFFFFF;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-text-inverse: #F8FAFC;
  --color-border-default: #E2E8F0;
  --color-border-subtle: #F1F5F9;
  --color-border-strong: #CBD5E1;
}
```

### ThemingProvider (`src/lib/theming.tsx`)

```tsx
import { createContext, useContext, ReactNode } from 'react';

/** Pre-composed class name strings for component roles */
export interface Theme {
  // Layout
  page: string;
  sidebar: string;
  card: string;
  elevated: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Interactive
  input: string;
  inputFocus: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonGhost: string;
  buttonDanger: string;
  hover: string;
  active: string;

  // Chat
  messageSelf: string;
  messageOther: string;
  messageAgent: string;
  messageSystem: string;

  // Status
  statusOnline: string;
  statusOffline: string;
  statusAway: string;

  // Badges
  badgeDefault: string;
  badgeSuccess: string;
  badgeWarning: string;
  badgeDanger: string;
  badgeInfo: string;

  // Notifications
  notificationBadge: string;
  notificationUnread: string;
  notificationRead: string;
}

const darkTheme: Theme = {
  // Layout
  page: 'bg-bg-page text-text-primary',
  sidebar: 'bg-bg-sidebar border-r border-border-default',
  card: 'bg-bg-card border border-border-default rounded-lg',
  elevated: 'bg-bg-elevated',

  // Text
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textMuted: 'text-text-muted',

  // Borders
  border: 'border border-border-default',
  borderSubtle: 'border border-border-subtle',

  // Interactive
  input: 'bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted',
  inputFocus: 'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30',
  buttonPrimary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  buttonSecondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90',
  buttonGhost: 'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  buttonDanger: 'bg-brand-danger text-white hover:bg-brand-danger/90',
  hover: 'hover:bg-bg-hover',
  active: 'bg-bg-active',

  // Chat
  messageSelf: 'bg-brand-primary/20 border-l-2 border-brand-primary/50',
  messageOther: 'bg-bg-card',
  messageAgent: 'bg-brand-accent/10 border-l-2 border-brand-accent/50',
  messageSystem: 'bg-bg-elevated text-text-muted text-sm italic',

  // Status
  statusOnline: 'bg-brand-success',
  statusOffline: 'bg-text-muted',
  statusAway: 'bg-brand-warning',

  // Badges
  badgeDefault: 'bg-bg-elevated text-text-secondary',
  badgeSuccess: 'bg-brand-success/15 text-brand-success',
  badgeWarning: 'bg-brand-warning/15 text-brand-warning',
  badgeDanger: 'bg-brand-danger/15 text-brand-danger',
  badgeInfo: 'bg-brand-info/15 text-brand-info',

  // Notifications
  notificationBadge: 'bg-brand-danger text-white',
  notificationUnread: 'bg-brand-primary/5',
  notificationRead: 'bg-bg-card',
};

const lightTheme: Theme = {
  // Layout
  page: 'bg-bg-page text-text-primary',
  sidebar: 'bg-bg-sidebar border-r border-border-default',
  card: 'bg-bg-card border border-border-default rounded-lg shadow-sm',
  elevated: 'bg-bg-elevated',

  // Text
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textMuted: 'text-text-muted',

  // Borders
  border: 'border border-border-default',
  borderSubtle: 'border border-border-subtle',

  // Interactive
  input: 'bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted',
  inputFocus: 'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30',
  buttonPrimary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  buttonSecondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90',
  buttonGhost: 'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  buttonDanger: 'bg-brand-danger text-white hover:bg-brand-danger/90',
  hover: 'hover:bg-bg-hover',
  active: 'bg-bg-active',

  // Chat
  messageSelf: 'bg-brand-primary/10 border-l-2 border-brand-primary/40',
  messageOther: 'bg-bg-card',
  messageAgent: 'bg-brand-accent/5 border-l-2 border-brand-accent/40',
  messageSystem: 'bg-bg-elevated text-text-muted text-sm italic',

  // Status
  statusOnline: 'bg-brand-success',
  statusOffline: 'bg-text-muted',
  statusAway: 'bg-brand-warning',

  // Badges
  badgeDefault: 'bg-bg-elevated text-text-secondary',
  badgeSuccess: 'bg-brand-success/15 text-brand-success',
  badgeWarning: 'bg-brand-warning/15 text-brand-warning',
  badgeDanger: 'bg-brand-danger/15 text-brand-danger',
  badgeInfo: 'bg-brand-info/15 text-brand-info',

  // Notifications
  notificationBadge: 'bg-brand-danger text-white',
  notificationUnread: 'bg-brand-primary/5',
  notificationRead: 'bg-bg-card',
};

export const themes = { dark: darkTheme, light: lightTheme } as const;
export type ThemeName = keyof typeof themes;

const ThemingContext = createContext<Theme>(darkTheme);

export function ThemingProvider({
  theme = 'dark',
  children,
}: {
  theme?: ThemeName;
  children: ReactNode;
}) {
  return (
    <ThemingContext.Provider value={themes[theme]}>
      <div data-theme={theme} className={themes[theme].page}>
        {children}
      </div>
    </ThemingContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemingContext);
}
```

### Component Usage

```tsx
import { useTheme } from '@/lib/theming';

function ChannelSidebar({ channels }) {
  const t = useTheme();
  return (
    <nav className={t.sidebar}>
      {channels.map((ch) => (
        <button key={ch.id} className={`${t.buttonGhost} w-full text-left px-3 py-1.5`}>
          # {ch.name}
        </button>
      ))}
    </nav>
  );
}

function ChatMessage({ message, isSelf }) {
  const t = useTheme();
  const style = isSelf ? t.messageSelf
    : message.role === 'assistant' ? t.messageAgent
    : message.role === 'system' ? t.messageSystem
    : t.messageOther;

  return (
    <div className={`${style} px-4 py-2 rounded-lg`}>
      <span className={t.textMuted}>{message.sender}</span>
      <p className={t.textPrimary}>{message.content}</p>
    </div>
  );
}
```

### Rules

1. **Never use raw Tailwind color classes in components** — always use `useTheme()` for colors, backgrounds, and borders
2. **Layout utilities are fine** — `flex`, `gap-2`, `px-4`, `rounded-lg`, `w-full` etc. don't go through the theme
3. **Never use `dark:` variants** — the theme handles light/dark via CSS variables + `data-theme` attribute
4. **Palette colors (`brand-*`) are constant** — they don't change between themes. Only contextual tokens (`bg-*`, `text-*`, `border-*`) change
5. **Extend the Theme interface** when adding new component types — don't inline colors as a workaround

---

## Benefits

- **Zero-touch theme switching**: Change `theme` prop on `ThemingProvider`, all components update
- **Type-safe**: `Theme` interface ensures all component roles are defined for every theme
- **Familiar pattern**: CSS variables for tokens (same as cleanbook-tanstack), React context for delivery
- **Composable**: Theme values are just strings — components can combine them with layout classes via template literals
- **Extensible**: Adding a new theme means adding a new `Theme` object, not touching any components

---

## Trade-offs

- **Indirection**: Developers must look up theme keys instead of writing Tailwind classes directly
  - *Mitigation*: Theme keys are semantic and self-documenting (`t.messageSelf`, `t.buttonPrimary`)
- **Bundle size**: Theme objects add a small amount of JS (class name strings)
  - *Mitigation*: Negligible — theme objects are ~2KB total
- **Tailwind purging**: Class names must be statically analyzable for Tailwind to include them
  - *Mitigation*: Theme objects are defined in a single file with all classes listed as string literals — Tailwind's scanner will find them

---

## Key Design Decisions

### Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Token delivery | React context (ThemingProvider) | Components get class names via `useTheme()` — no prop drilling, single source of truth |
| Token format | Pre-composed Tailwind class strings | Components don't construct colors — they receive ready-to-use class names |
| CSS variables | Tailwind `@theme` directive | Same pattern as cleanbook-tanstack, proven approach |
| Default theme | Dark | Slack-like dark mode is the primary UX; light theme available |

### Color Palette

| Decision | Choice | Rationale |
|---|---|---|
| Primary | `#7C3AED` (violet) | Distinct from agentbase.me (blue/purple gradient) and cleanbook (pink) |
| Secondary | `#2563EB` (blue) | Complementary, good for links and secondary actions |
| Accent | `#06B6D4` (cyan) | Agent/AI responses — visually distinct from user messages |
| Dark background | Slate palette (`#0F172A` base) | Slack-like dark mode, easier on eyes for extended use |

---

## Dependencies

- Tailwind CSS v4+ (for `@theme` directive)
- React (for context provider)

---

## Future Considerations

- Custom workspace themes (user-defined brand colors)
- High contrast / accessibility theme
- Theme persistence via localStorage or user preferences (Firestore)
- CSS-only theme switching (no JS) for SSR performance

---

**Status**: Design Specification
**Recommendation**: Implement `src/styles.css` tokens and `src/lib/theming.tsx` as part of project scaffolding, before any UI components
**Related Documents**: [local.requirements.md](local.requirements.md)
