/**
 * AppShell — main layout wrapper combining header, sidebar, content area,
 * and mobile bottom navigation.
 *
 * Provides the unified notification + theme state to all child components.
 */

import { useState, useCallback, useEffect } from 'react'
import { Outlet, useRouter, useMatches } from '@tanstack/react-router'
import { useTheme, type ThemeName } from '@/lib/theming'
import { useAuth } from '@/components/auth/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { UnifiedHeader, HEADER_HEIGHT_CLASS } from './UnifiedHeader'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { PushPermissionPrompt } from '@/components/notifications/PushPermissionPrompt'
import { initializeFCM } from '@/lib/fcm'
import type { Notification } from '@/types/notifications'

interface AppShellProps {
  currentTheme: ThemeName
  onThemeToggle: (theme: ThemeName) => void
}

export function AppShell({ currentTheme, onThemeToggle }: AppShellProps) {
  const t = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const matches = useMatches()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Derive current view title from route matches
  const currentTitle = (() => {
    const lastMatch = matches[matches.length - 1]
    if (lastMatch?.context && typeof lastMatch.context === 'object' && 'title' in lastMatch.context) {
      return lastMatch.context.title as string
    }
    return undefined
  })()

  // Notification system
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.uid, {
    wsUrl: '/api/notifications-ws',
    api: {
      fetchNotifications: async ({ limit }) => {
        const res = await fetch(`/api/notifications?limit=${limit}`)
        if (!res.ok) return []
        return res.json()
      },
      fetchUnreadCount: async () => {
        const res = await fetch('/api/notifications/unread-count')
        if (!res.ok) return 0
        const data = await res.json()
        return data.count ?? 0
      },
      markAsRead: async (id) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      },
      markAllAsRead: async () => {
        await fetch('/api/notifications/read-all', { method: 'POST' })
      },
      deleteNotification: async (id) => {
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      },
    },
  })

  // Map notification data shape for the panel
  // useNotifications returns the hook's Notification shape; map to @/types/notifications
  const mappedNotifications: Notification[] = notifications.map((n) => ({
    id: n.id,
    user_id: user?.uid ?? '',
    type: n.type as Notification['type'],
    title: n.title,
    body: n.message,
    conversation_id: (n.data?.conversation_id as string) ?? null,
    read: n.isRead,
    created_at: n.createdAt,
  }))

  // Initialize FCM on mount (if permission already granted)
  useEffect(() => {
    if (user) {
      initializeFCM().catch(() => {})
    }
  }, [user])

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [matches])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (notification.conversation_id) {
        router.navigate({ to: `/chat/${notification.conversation_id}` })
      }
    },
    [router],
  )

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className={`min-h-screen ${t.page}`}>
      {/* Fixed Header */}
      <UnifiedHeader
        title={currentTitle}
        onToggleSidebar={handleToggleSidebar}
        sidebarOpen={sidebarOpen}
        currentTheme={currentTheme}
        onThemeToggle={onThemeToggle}
        notifications={mappedNotifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onNotificationClick={handleNotificationClick}
      />

      {/* Sidebar (desktop: always visible, mobile: slide-over) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main
        className={`${HEADER_HEIGHT_CLASS} lg:pl-44 pb-16 md:pb-0 min-h-screen`}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Push Permission Prompt (shown once) */}
      {user && <PushPermissionPrompt />}
    </div>
  )
}
