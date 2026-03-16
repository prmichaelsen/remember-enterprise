import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theming'

export interface ToastProps {
  message: string
  variant?: 'success' | 'error' | 'info'
  onDismiss: () => void
}

export function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  const t = useTheme()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger fade-in on mount
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const variantClass =
    variant === 'error'
      ? t.badgeDanger
      : variant === 'success'
        ? t.badgeSuccess
        : t.elevated

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-sm shadow-lg transition-opacity duration-200 ${variantClass} ${t.textPrimary} ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      {message}
    </div>
  )
}
