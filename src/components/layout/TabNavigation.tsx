/**
 * TabNavigation — three tabs: Chat, Memories, Ghost.
 * Desktop: rendered in sidebar. Active tab via ThemingProvider t.active class.
 * Route-driven — uses TanStack Router's Link with activeProps.
 */

import { Link } from '@tanstack/react-router'
import { MessageSquare, Brain, Ghost, Globe, Users } from 'lucide-react'
import { useTheme } from '@/lib/theming'

export interface TabItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

export const DEFAULT_TABS: TabItem[] = [
  { label: 'Chat', to: '/chat', icon: MessageSquare },
  { label: 'Memories', to: '/memories', icon: Brain },
  { label: 'The Void', to: '/void', icon: Globe },
  { label: 'Ghost', to: '/ghost', icon: Ghost },
  { label: 'Friends', to: '/friends', icon: Users },
]

interface TabNavigationProps {
  tabs?: TabItem[]
  /** Orientation: vertical for sidebar, horizontal for inline */
  orientation?: 'vertical' | 'horizontal'
}

export function TabNavigation({
  tabs = DEFAULT_TABS,
  orientation = 'vertical',
}: TabNavigationProps) {
  const t = useTheme()

  const isVertical = orientation === 'vertical'
  const containerClass = isVertical
    ? 'flex flex-col gap-1'
    : 'flex items-center gap-1'

  return (
    <nav className={containerClass} role="tablist" aria-label="Main navigation">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          role="tab"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${t.textSecondary} ${t.hover} transition-colors ${
            isVertical ? 'w-full' : ''
          }`}
          activeProps={{
            className: `${t.active} ${t.textPrimary} font-medium`,
            'aria-selected': 'true',
          }}
          activeOptions={{ exact: tab.exact }}
        >
          <tab.icon className="w-5 h-5 shrink-0" />
          <span className="text-sm">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
