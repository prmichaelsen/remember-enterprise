import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { AuthForm } from '@/components/auth/AuthForm'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const t = useTheme()
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${t.page}`}>
      <div className={`w-full max-w-sm ${t.card} p-6`}>
        <h1 className="text-2xl font-bold text-center mb-1 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
          Remember
        </h1>
        <p className={`text-center ${t.textMuted} text-sm mb-6`}>
          Enterprise memory platform for teams
        </p>
        <AuthForm
          onSuccess={() => {
            navigate({ to: '/chat' })
          }}
        />
      </div>
    </div>
  )
}
