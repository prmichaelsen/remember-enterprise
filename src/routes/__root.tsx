import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { ThemingProvider } from '@/lib/theming'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
  beforeLoad: async () => {
    // SSR preload pattern: auth session loaded server-side
    // Auth integration will be added in Task 4
    return { initialUser: null }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Remember Enterprise' },
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
  return (
    <ThemingProvider theme="dark">
      <div className="min-h-screen">
        <Outlet />
      </div>
    </ThemingProvider>
  )
}
