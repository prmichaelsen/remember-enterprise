import { useCallback, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import type { ActionBarItem } from '@/types/action-bar'
import { Popover } from './Popover'

interface ActionBarProps {
  items: ActionBarItem[]
  layout?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}

const layoutClasses = {
  horizontal: 'flex items-center gap-1',
  vertical: 'flex flex-col gap-1',
  compact: 'flex items-center gap-0.5',
}

export function ActionBar({ items, layout = 'horizontal', className = '' }: ActionBarProps) {
  const t = useTheme()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const visibleItems = items.filter((item) => !item.hidden)
  const activeItem = openKey ? visibleItems.find((item) => item.key === openKey) : null

  const closePopover = useCallback(() => {
    if (openKey) {
      const closing = visibleItems.find((item) => item.key === openKey)
      closing?.onContentClose?.()
    }
    setOpenKey(null)
  }, [openKey, visibleItems])

  const handleClick = useCallback(
    (item: ActionBarItem) => {
      if (item.disabled || item.loading) return

      if (item.renderContent) {
        if (openKey === item.key) {
          closePopover()
        } else {
          if (openKey) {
            const prev = visibleItems.find((i) => i.key === openKey)
            prev?.onContentClose?.()
          }
          setOpenKey(item.key)
        }
      } else {
        item.onTrigger?.()
      }
    },
    [openKey, closePopover, visibleItems],
  )

  const setTriggerRef = useCallback(
    (item: ActionBarItem, el: HTMLButtonElement | null) => {
      triggerRefs.current[item.key] = el
      if (item.triggerRef && 'current' in item.triggerRef) {
        ;(item.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = el
      }
    },
    [],
  )

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {visibleItems.map((item) => (
        <button
          key={item.key}
          ref={(el) => setTriggerRef(item, el)}
          onClick={() => handleClick(item)}
          title={item.label}
          className={`p-1.5 rounded transition-colors ${t.buttonGhost} ${
            item.active ? t.active : ''
          } ${item.disabled ? 'opacity-50 pointer-events-none' : ''} ${
            item.danger ? 'hover:!text-brand-danger' : ''
          }`}
        >
          {item.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <item.icon className={`w-4 h-4 ${item.iconClassName ?? ''}`} />
          )}
        </button>
      ))}

      {activeItem?.renderContent && (
        <Popover
          anchorRef={{ current: triggerRefs.current[activeItem.key] ?? null }}
          onClose={closePopover}
        >
          {activeItem.renderContent({
            close: closePopover,
            anchorRef: { current: triggerRefs.current[activeItem.key] ?? null },
          })}
        </Popover>
      )}

      {items.map((item) => (
        <span key={`modal-${item.key}`}>{item.renderModals?.()}</span>
      ))}
    </div>
  )
}
