import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/lib/theming'

interface PopoverProps {
  children: ReactNode
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
}

export function Popover({ children, anchorRef, onClose }: PopoverProps) {
  const t = useTheme()
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const spaceAbove = rect.top
    const popoverHeight = popoverRef.current?.offsetHeight ?? 200

    if (spaceAbove >= popoverHeight + 8) {
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    } else {
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
  }, [anchorRef])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose, anchorRef])

  return createPortal(
    <div
      ref={popoverRef}
      className={`absolute z-50 -translate-x-1/2 -translate-y-full ${t.card} p-3 shadow-lg`}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>,
    document.body,
  )
}
