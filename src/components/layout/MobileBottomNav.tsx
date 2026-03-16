/**
 * MobileBottomNav — bottom navigation on mobile (< 768px).
 * Tab icons: MessageSquare, Brain, Ghost from lucide-react.
 * Active indicator. Hides when virtual keyboard is open.
 */

import { Link } from '@tanstack/react-router'
import { MessageSquare, Brain } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theming'

export interface MobileNavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

export const DEFAULT_MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Chat', to: '/chat', icon: MessageSquare },
  { label: 'Memories', to: '/memories', icon: Brain },
]

interface MobileBottomNavProps {
  items?: MobileNavItem[]
}

export function MobileBottomNav({
  items = DEFAULT_MOBILE_NAV_ITEMS,
}: MobileBottomNavProps) {
  const t = useTheme()
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  // Detect virtual keyboard by monitoring viewport height changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initialHeight = window.innerHeight

    function handleResize() {
      // If viewport shrinks significantly, keyboard is likely open
      const currentHeight = window.innerHeight
      const heightDiff = initialHeight - currentHeight
      setKeyboardOpen(heightDiff > 150)
    }

    // Use visualViewport API if available (more reliable)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport?.removeEventListener('resize', handleResize)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Hide when keyboard is open or on non-mobile screens
  if (keyboardOpen) return null

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 h-16 ${t.page} border-t border-border-default flex items-center justify-around z-50 md:hidden`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${t.textMuted} transition-colors relative`}
          activeProps={{
            className: `${t.textPrimary}`,
          }}
          activeOptions={{ exact: item.exact }}
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-primary rounded-full" />
              )}
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  )
}
