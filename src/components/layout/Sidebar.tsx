/**
 * Sidebar — responsive sidebar navigation.
 * Desktop (>= 1024px): always visible, 240px wide.
 * Tablet (768-1023px): collapsible.
 * Mobile (< 768px): slide-over overlay with backdrop.
 * Includes transition animations.
 */

import { X, LogIn, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { TabNavigation, type TabItem, DEFAULT_TABS } from './TabNavigation'

interface SidebarProps {
  open: boolean
  onClose: () => void
  tabs?: TabItem[]
  /** Additional content rendered below tabs (e.g., conversation list) */
  children?: React.ReactNode
}

function SidebarFooter() {
  const t = useTheme()
  const { user } = useAuth()
  const isAnonymous = !user || user.isAnonymous

  return (
    <div className={`px-1.5 py-3 border-t border-border-default`}>
      {isAnonymous ? (
        <Link
          to="/auth"
          className={`flex flex-col items-center gap-0.5 w-full px-1 py-2 rounded-md ${t.buttonGhost} transition-colors`}
        >
          <LogIn className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Sign in</span>
        </Link>
      ) : (
        <Link
          to="/settings"
          className={`flex flex-col items-center gap-0.5 w-full px-1 py-2 rounded-md ${t.buttonGhost} transition-colors`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Settings</span>
        </Link>
      )}
    </div>
  )
}

export function Sidebar({
  open,
  onClose,
  tabs = DEFAULT_TABS,
  children,
}: SidebarProps) {
  const t = useTheme()

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-14 left-0 bottom-0 w-[72px] ${t.sidebar} z-40 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <span className={`text-sm font-semibold ${t.textPrimary}`}>Menu</span>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-md ${t.buttonGhost} transition-colors`}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-1.5 pt-3 pb-2">
          <TabNavigation tabs={tabs} orientation="vertical" />
        </div>

        {/* Divider */}
        <div className={`mx-2 ${t.borderSubtle} border-b`} />

        {/* Additional content (conversation list, etc.) */}
        <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {children}
        </div>

        {/* Bottom section: Login / Settings */}
        <SidebarFooter />
      </aside>
    </>
  )
}
