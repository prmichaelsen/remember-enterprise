import { useState } from 'react'
import { useTheme } from '@/lib/theming'

interface ConfirmRendererProps {
  text: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  variant?: 'danger' | 'default'
  close: () => void
}

export function ConfirmRenderer({
  text,
  confirmLabel,
  onConfirm,
  loading = false,
  variant = 'default',
  close,
}: ConfirmRendererProps) {
  const t = useTheme()
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
      close()
    } finally {
      setConfirming(false)
    }
  }

  const isLoading = loading || confirming

  return (
    <div className="flex flex-col gap-3 min-w-48">
      <p className={`text-sm ${t.textPrimary}`}>{text}</p>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={close}
          disabled={isLoading}
          className={`px-3 py-1.5 text-sm rounded ${t.buttonGhost}`}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-3 py-1.5 text-sm rounded ${
            variant === 'danger' ? t.buttonDanger : t.buttonPrimary
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
