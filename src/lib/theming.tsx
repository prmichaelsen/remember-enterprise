import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { shortKeyToCssVar } from '@/lib/theme-variables'

/** Pre-composed class name strings for component roles */
export interface Theme {
  page: string
  sidebar: string
  card: string
  elevated: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  borderSubtle: string
  input: string
  inputFocus: string
  buttonPrimary: string
  buttonSecondary: string
  buttonGhost: string
  buttonDanger: string
  hover: string
  active: string
  messageSelf: string
  messageOther: string
  messageAgent: string
  messageSystem: string
  statusOnline: string
  statusOffline: string
  statusAway: string
  badgeDefault: string
  badgeSuccess: string
  badgeWarning: string
  badgeDanger: string
  badgeInfo: string
  notificationBadge: string
  notificationUnread: string
  notificationRead: string
}

const darkTheme: Theme = {
  page: 'bg-bg-page text-text-primary',
  sidebar: 'bg-bg-sidebar border-r border-border-default',
  card: 'bg-bg-card border border-border-default rounded-lg',
  elevated: 'bg-bg-elevated',
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textMuted: 'text-text-muted',
  border: 'border border-border-default',
  borderSubtle: 'border border-border-subtle',
  input:
    'bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted',
  inputFocus: 'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30',
  buttonPrimary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  buttonSecondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90',
  buttonGhost:
    'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  buttonDanger: 'bg-brand-danger text-white hover:bg-brand-danger/90',
  hover: 'hover:bg-bg-hover',
  active: 'bg-bg-active',
  messageSelf: 'bg-brand-primary/20 border-l-2 border-brand-primary/50',
  messageOther: 'bg-bg-card',
  messageAgent: 'bg-brand-accent/10 border-l-2 border-brand-accent/50',
  messageSystem: 'bg-bg-elevated text-text-muted text-sm italic',
  statusOnline: 'bg-brand-success',
  statusOffline: 'bg-text-muted',
  statusAway: 'bg-brand-warning',
  badgeDefault: 'bg-bg-elevated text-text-secondary',
  badgeSuccess: 'bg-brand-success/15 text-brand-success',
  badgeWarning: 'bg-brand-warning/15 text-brand-warning',
  badgeDanger: 'bg-brand-danger/15 text-brand-danger',
  badgeInfo: 'bg-brand-info/15 text-brand-info',
  notificationBadge: 'bg-brand-danger text-white',
  notificationUnread: 'bg-brand-primary/5',
  notificationRead: 'bg-bg-card',
}

const lightTheme: Theme = {
  page: 'bg-bg-page text-text-primary',
  sidebar: 'bg-bg-sidebar border-r border-border-default',
  card: 'bg-bg-card border border-border-default rounded-lg shadow-sm',
  elevated: 'bg-bg-elevated',
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textMuted: 'text-text-muted',
  border: 'border border-border-default',
  borderSubtle: 'border border-border-subtle',
  input:
    'bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted',
  inputFocus: 'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30',
  buttonPrimary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
  buttonSecondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90',
  buttonGhost:
    'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  buttonDanger: 'bg-brand-danger text-white hover:bg-brand-danger/90',
  hover: 'hover:bg-bg-hover',
  active: 'bg-bg-active',
  messageSelf: 'bg-brand-primary/10 border-l-2 border-brand-primary/40',
  messageOther: 'bg-bg-card',
  messageAgent: 'bg-brand-accent/5 border-l-2 border-brand-accent/40',
  messageSystem: 'bg-bg-elevated text-text-muted text-sm italic',
  statusOnline: 'bg-brand-success',
  statusOffline: 'bg-text-muted',
  statusAway: 'bg-brand-warning',
  badgeDefault: 'bg-bg-elevated text-text-secondary',
  badgeSuccess: 'bg-brand-success/15 text-brand-success',
  badgeWarning: 'bg-brand-warning/15 text-brand-warning',
  badgeDanger: 'bg-brand-danger/15 text-brand-danger',
  badgeInfo: 'bg-brand-info/15 text-brand-info',
  notificationBadge: 'bg-brand-danger text-white',
  notificationUnread: 'bg-brand-primary/5',
  notificationRead: 'bg-bg-card',
}

export const themes = { dark: darkTheme, light: lightTheme } as const
export type ThemeName = keyof typeof themes

const ThemingContext = createContext<Theme>(darkTheme)

export function ThemingProvider({
  theme = 'dark',
  customVariables,
  children,
}: {
  theme?: ThemeName
  customVariables?: Record<string, string>
  children: ReactNode
}) {
  // Build inline style from custom variables to override data-theme defaults
  const customStyle = customVariables
    ? Object.fromEntries(
        Object.entries(customVariables).map(([shortKey, value]) => [
          shortKeyToCssVar(shortKey),
          value,
        ]),
      ) as React.CSSProperties
    : undefined

  return (
    <ThemingContext.Provider value={themes[theme]}>
      <div data-theme={theme} className={themes[theme].page} style={customStyle}>
        {children}
      </div>
    </ThemingContext.Provider>
  )
}

export function useTheme(): Theme {
  return useContext(ThemingContext)
}
