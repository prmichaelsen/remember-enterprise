import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { MessageSquare, Brain, Ghost } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const t = useTheme()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold mb-3">Remember Enterprise</h1>
        <p className={`${t.textSecondary} text-lg mb-8`}>
          Enterprise memory platform for teams
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <Feature icon={<MessageSquare className="w-5 h-5" />} label="Chat" />
          <Feature icon={<Brain className="w-5 h-5" />} label="Memories" />
          <Feature icon={<Ghost className="w-5 h-5" />} label="Ghost" />
        </div>

        <a
          href="/auth"
          className={`${t.buttonPrimary} inline-block px-6 py-3 rounded-lg font-medium transition-colors`}
        >
          Get Started
        </a>
      </div>
    </div>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  const t = useTheme()
  return (
    <div className={`${t.card} px-4 py-3 flex items-center gap-2`}>
      <span className="text-brand-primary">{icon}</span>
      <span className={t.textPrimary}>{label}</span>
    </div>
  )
}
