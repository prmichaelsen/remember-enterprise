import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Toast } from './Toast'

export interface ToastOptions {
  message: string
  variant?: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastOptions | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setCurrent(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      // Replace current toast
      setCurrent(options)
      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        setCurrent(null)
        timerRef.current = null
      }, options.duration ?? 1500)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current &&
        createPortal(
          <Toast
            message={current.message}
            variant={current.variant}
            onDismiss={dismiss}
          />,
          document.body,
        )}
    </ToastContext.Provider>
  )
}
