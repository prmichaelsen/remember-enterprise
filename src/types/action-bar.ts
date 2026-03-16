import type { LucideIcon } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

export interface ActionBarItem {
  key: string
  icon: LucideIcon
  label: string
  onTrigger?: () => void
  renderContent?: (ctx: ActionBarContentContext) => ReactNode
  renderModals?: () => ReactNode
  onContentClose?: () => void
  triggerRef?: RefObject<HTMLButtonElement | null>
  loading?: boolean
  disabled?: boolean
  hidden?: boolean
  danger?: boolean
  active?: boolean
  iconClassName?: string
  suffix?: ReactNode
}

export interface ActionBarContentContext {
  close: () => void
  anchorRef: RefObject<HTMLElement | null>
}
