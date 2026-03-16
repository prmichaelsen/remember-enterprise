/**
 * Root Route — wraps app in AuthProvider + ThemingProvider.
 * Includes AppShell for authenticated routes.
 * Wires up theme toggle state with localStorage persistence.
 */

import { useState } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { ThemingProvider, type ThemeName } from '@/lib/theming'
import { AuthProvider } from '@/components/auth/AuthContext'
import { ToastProvider, StandaloneToastContainer } from '@prmichaelsen/pretty-toasts/standalone'
import { AppShell } from '@/components/layout/AppShell'
import { getStoredTheme } from '@/components/layout/ThemeToggle'
import { getAuthSession } from '@/lib/auth/server-fn'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
  beforeLoad: async () => {
    try {
      const initialUser = await getAuthSession()
      return { initialUser }
    } catch {
      return { initialUser: null }
    }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Memory Cloud' },
      {
        name: 'description',
        content: 'Enterprise memory platform for teams',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-text-muted">Page not found</p>
      </div>
    </div>
  )
}

function RootLayout() {
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme())
  const { initialUser } = Route.useRouteContext()

  return (
    <AuthProvider initialUser={initialUser}>
      <ThemingProvider theme={theme}>
        <ToastProvider>
          <AppShell currentTheme={theme} onThemeToggle={setTheme} />
          <StandaloneToastContainer />
        </ToastProvider>
      </ThemingProvider>
    </AuthProvider>
  )
}
