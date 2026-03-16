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
import { NotificationClientService } from '@/services/notification-client.service'
import { UnifiedHeader, HEADER_HEIGHT_CLASS } from './UnifiedHeader'
import { HeaderProvider, useHeader } from '@/contexts/HeaderContext'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
// FCM disabled until Firebase appId is configured
// import { PushPermissionPrompt } from '@/components/notifications/PushPermissionPrompt'
// import { initializeFCM } from '@/lib/fcm'
import type { Notification } from '@/types/notifications'
import { CommandPalette } from '@/components/search/CommandPalette'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/ToastProvider'

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Header title/actions from child routes via context
  const { title: currentTitle, headerActions, onEllipsisPress } = useHeader()

  // Notification system
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.uid, {
    wsUrl: '/api/notifications-ws',
    api: NotificationClientService,
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

  // FCM disabled until Firebase appId is configured
  // useEffect(() => {
  //   if (user) {
  //     initializeFCM().catch(() => {})
  //   }
  // }, [user])

  // Cmd+K / Ctrl+K to toggle command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
    <ToastProvider>
    <div className={`min-h-screen ${t.page}`}>
      {/* Fixed Header */}
      <UnifiedHeader
        title={currentTitle}
        headerActions={headerActions}
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
        onEllipsisPress={onEllipsisPress}
      />

      {/* Sidebar (desktop: always visible, mobile: slide-over) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main
        className={`${HEADER_HEIGHT_CLASS} lg:pl-[72px] pb-16 md:pb-0 min-h-screen`}
      >
        <ErrorBoundary name="PageContent">
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* FCM disabled until Firebase appId is configured */}
      {/* {user && <PushPermissionPrompt />} */}
    </div>
    </ToastProvider>
  )
}
