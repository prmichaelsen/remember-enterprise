import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/lib/auth/server-fn'

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
  beforeLoad: async () => {
    const user = await getAuthSession()
    if (!user) {
      throw redirect({ to: '/auth' })
    }
    return { user }
  },
})

function SettingsLayout() {
  return (
    <div className="py-6">
      <Outlet />
    </div>
  )
}
