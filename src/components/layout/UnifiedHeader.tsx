/**
 * UnifiedHeader — fixed header for the app.
 * Left: hamburger (mobile) / logo.
 * Center: current view title.
 * Right: theme toggle + notification bell + user avatar dropdown.
 */

import { Link } from '@tanstack/react-router'
import { Menu, X, LogOut, User, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTheme, type ThemeName } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { signOut } from '@/lib/firebase-client'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import type { Notification } from '@/types/notifications'

export const HEADER_HEIGHT_CLASS = 'pt-14'
export const HEADER_TOP_CLASS = 'top-14'

interface UnifiedHeaderProps {
  /** Current view title displayed in center */
  title?: string
  /** Callback to toggle sidebar on mobile */
  onToggleSidebar?: () => void
  /** Whether sidebar is currently open */
  sidebarOpen?: boolean
  /** Theme management */
  currentTheme: ThemeName
  onThemeToggle: (theme: ThemeName) => void
  /** Notification data */
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onDeleteNotification: (id: string) => Promise<void>
  onNotificationClick?: (notification: Notification) => void
}

export function UnifiedHeader({
  title,
  onToggleSidebar,
  sidebarOpen = false,
  currentTheme,
  onThemeToggle,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationClick,
}: UnifiedHeaderProps) {
  const t = useTheme()
  const { user } = useAuth()
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)

  // Close avatar menu on click outside
  useEffect(() => {
    if (!avatarMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [avatarMenuOpen])

  const handleLogout = async () => {
    setAvatarMenuOpen(false)
    try {
      await signOut()
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Best effort
    }
    window.location.href = '/auth'
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${t.page} border-b border-border-default`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Hamburger (mobile) / Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger — visible on mobile/tablet, hidden on desktop */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-md ${t.buttonGhost} transition-colors lg:hidden`}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="text-lg font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent"
          >
            Memory Cloud
          </Link>
        </div>

        {/* Center: View title (shown on larger screens) */}
        {title && (
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <h1 className={`text-sm font-semibold ${t.textPrimary} truncate max-w-[300px]`}>
              {title}
            </h1>
          </div>
        )}

        {/* Right: Theme toggle + Notification bell + User avatar */}
        <div className="flex items-center gap-1">
          <ThemeToggle currentTheme={currentTheme} onToggle={onThemeToggle} />

          <NotificationBell
            unreadCount={unreadCount}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDelete={onDeleteNotification}
            onNotificationClick={onNotificationClick}
          />

          {/* User Avatar Dropdown */}
          <div ref={avatarMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className={`p-1 rounded-full ${t.hover} transition-colors`}
              aria-label="User menu"
              aria-expanded={avatarMenuOpen}
              aria-haspopup="true"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full ${t.elevated} flex items-center justify-center`}>
                  <User className={`w-4 h-4 ${t.textSecondary}`} />
                </div>
              )}
            </button>

            {/* Dropdown menu */}
            {avatarMenuOpen && (
              <div className={`absolute right-0 top-full mt-2 w-56 ${t.card} shadow-lg overflow-hidden z-50`}>
                {/* User info */}
                {user && (
                  <div className={`px-4 py-3 border-b ${t.borderSubtle}`}>
                    <p className={`text-sm font-medium ${t.textPrimary} truncate`}>
                      {user.displayName || 'User'}
                    </p>
                    <p className={`text-xs ${t.textMuted} truncate`}>
                      {user.email}
                    </p>
                  </div>
                )}

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm ${t.textSecondary} ${t.hover} transition-colors`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left text-brand-danger ${t.hover} transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
