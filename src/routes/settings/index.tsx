import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { Search, User, Bell, Trash2, Shield, FileText, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { signOut } from '@/lib/firebase-client'

interface SettingsItem {
  id: string
  name: string
  description: string
  category: string
  keywords: string[]
}

const SETTINGS_REGISTRY: SettingsItem[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'Manage your display name and email',
    category: 'Account',
    keywords: ['profile', 'name', 'email', 'display', 'avatar'],
  },
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Theme and display preferences',
    category: 'General',
    keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'color'],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Push and in-app notification preferences',
    category: 'General',
    keywords: ['notifications', 'push', 'alerts', 'bell', 'sounds', 'mute'],
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Sign out or delete your account',
    category: 'Account',
    keywords: ['account', 'delete', 'sign out', 'logout', 'deactivate'],
  },
  {
    id: 'legal',
    name: 'Legal & Privacy',
    description: 'Terms of service and privacy policy',
    category: 'Legal',
    keywords: ['legal', 'privacy', 'terms', 'tos', 'policy'],
  },
]

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const t = useTheme()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [notifyDMs, setNotifyDMs] = useState(true)
  const [notifyGroups, setNotifyGroups] = useState(true)
  const [notifyAgent, setNotifyAgent] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.slice(1))
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [])

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SETTINGS_REGISTRY
    const words = search.toLowerCase().split(/\s+/)
    return SETTINGS_REGISTRY.filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.keywords.join(' ')}`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }, [search])

  const visibleIds = new Set(filteredSections.map((s) => s.id))

  const handleSignOut = async () => {
    try {
      await signOut()
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Best effort
    }
    window.location.href = '/auth'
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Settings</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search settings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg ${t.input} ${t.inputFocus}`}
        />
      </div>

      {/* Profile */}
      {visibleIds.has('profile') && (
        <section id="profile" className={`${t.card} p-6`}>
          <h2 className={`text-lg font-semibold ${t.textPrimary} mb-1`}>Profile</h2>
          <p className={`text-sm ${t.textMuted} mb-4`}>Your account information</p>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm ${t.textSecondary} mb-1`}>Email</label>
              <input
                type="email"
                value={user?.email ?? 'Anonymous'}
                disabled
                className={`w-full px-3 py-2 ${t.elevated} border border-border-default rounded-lg ${t.textMuted} cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={`block text-sm ${t.textSecondary} mb-1`}>Display Name</label>
              <input
                type="text"
                defaultValue={user?.displayName ?? ''}
                placeholder="Your name"
                className={`w-full px-3 py-2 rounded-lg ${t.input} ${t.inputFocus}`}
              />
            </div>
            {user?.isAnonymous && (
              <p className={`text-xs ${t.textMuted}`}>
                You're using an anonymous account.{' '}
                <a href="/auth" className="text-brand-primary hover:text-brand-secondary">
                  Sign in
                </a>{' '}
                to save your profile.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Appearance */}
      {visibleIds.has('appearance') && (
        <section id="appearance" className={`${t.card} p-6`}>
          <h2 className={`text-lg font-semibold ${t.textPrimary} mb-1`}>Appearance</h2>
          <p className={`text-sm ${t.textMuted} mb-4`}>Theme and display preferences</p>
          <div className="flex gap-3">
            <ThemeOption icon={Moon} label="Dark" value="dark" />
            <ThemeOption icon={Sun} label="Light" value="light" />
          </div>
          <ActiveThemeDisplay />
          <Link to="/settings/theme" className="text-sm text-brand-primary hover:text-brand-secondary mt-2 inline-block">
            Customize Theme &rarr;
          </Link>
        </section>
      )}

      {/* Notifications */}
      {visibleIds.has('notifications') && (
        <section id="notifications" className={`${t.card} p-6`}>
          <h2 className={`text-lg font-semibold ${t.textPrimary} mb-1`}>Notifications</h2>
          <p className={`text-sm ${t.textMuted} mb-4`}>Control what you get notified about</p>
          <div className="space-y-4">
            <ToggleRow
              label="Push Notifications"
              description="Receive push notifications when the app is backgrounded"
              checked={pushEnabled}
              onChange={setPushEnabled}
            />
            <ToggleRow
              label="Direct Messages"
              description="Get notified when someone sends you a DM"
              checked={notifyDMs}
              onChange={setNotifyDMs}
            />
            <ToggleRow
              label="Group Messages"
              description="Get notified for new messages in groups"
              checked={notifyGroups}
              onChange={setNotifyGroups}
            />
            <ToggleRow
              label="Agent Responses"
              description="Get notified when @agent responds to your commands"
              checked={notifyAgent}
              onChange={setNotifyAgent}
            />
          </div>
        </section>
      )}

      {/* Account */}
      {visibleIds.has('account') && (
        <section id="account" className={`${t.card} p-6`}>
          <h2 className={`text-lg font-semibold ${t.textPrimary} mb-1`}>Account</h2>
          <p className={`text-sm ${t.textMuted} mb-4`}>Account management</p>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-2 ${t.textSecondary} hover:text-text-primary text-sm font-medium transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button className="flex items-center gap-2 text-brand-danger hover:text-brand-danger/80 text-sm font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </section>
      )}

      {/* Legal */}
      {visibleIds.has('legal') && (
        <section id="legal" className={`${t.card} p-6`}>
          <h2 className={`text-lg font-semibold ${t.textPrimary} mb-1`}>Legal & Privacy</h2>
          <p className={`text-sm ${t.textMuted} mb-4`}>Review our policies</p>
          <div className="space-y-3">
            <LegalLink icon={FileText} label="Terms of Service" description="Service agreement and usage terms" href="/terms" />
            <LegalLink icon={Shield} label="Privacy Policy" description="How we collect, use, and protect your data" href="/privacy" />
          </div>
        </section>
      )}

      {filteredSections.length === 0 && (
        <div className={`text-center py-12 ${t.textMuted}`}>
          No settings match your search
        </div>
      )}
    </div>
  )
}

function ThemeOption({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  const t = useTheme()
  const currentTheme = document.documentElement.querySelector('[data-theme]')?.getAttribute('data-theme')
  const isSelected = currentTheme === value

  return (
    <button
      onClick={() => {
        localStorage.setItem('remember_theme', value)
        window.location.reload()
      }}
      className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-brand-primary bg-brand-primary/5'
          : `border-border-default ${t.hover}`
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : t.textMuted}`} />
        <span className={`font-medium text-sm ${isSelected ? 'text-brand-primary' : t.textPrimary}`}>
          {label}
        </span>
      </div>
    </button>
  )
}

function ActiveThemeDisplay() {
  const t = useTheme()
  const stored = typeof window !== 'undefined' ? localStorage.getItem('remember_theme') : null
  let activeThemeName = 'Dark'
  if (stored === 'light') {
    activeThemeName = 'Light'
  } else if (stored === 'dark' || !stored) {
    activeThemeName = 'Dark'
  } else {
    activeThemeName = stored
  }

  return (
    <p className={`text-sm mt-3 ${t.textSecondary}`}>
      Active: <span className={t.textPrimary}>{activeThemeName}</span>
    </p>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-brand-primary' : 'bg-border-default'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function LegalLink({ icon: Icon, label, description, href }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  href: string
}) {
  const t = useTheme()
  return (
    <a href={href} className={`flex items-center gap-3 p-3 rounded-lg ${t.hover} transition-colors`}>
      <Icon className={`w-5 h-5 ${t.textMuted}`} />
      <div>
        <p className={`text-sm font-medium ${t.textPrimary}`}>{label}</p>
        <p className={`text-xs ${t.textMuted}`}>{description}</p>
      </div>
    </a>
  )
}
