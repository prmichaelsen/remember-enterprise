import { useRef, useCallback } from 'react'
import { EllipsisVertical } from 'lucide-react'
import { ActionBar } from '@/components/action-bar/ActionBar'
import type { ActionBarItem, ActionBarContentContext } from '@/types/action-bar'

export function useOverflowActionBarItem(items: ActionBarItem[]): ActionBarItem {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const renderContent = useCallback(
    (_ctx: ActionBarContentContext) => <ActionBar items={items} layout="vertical" />,
    [items],
  )

  return {
    key: 'overflow',
    icon: EllipsisVertical,
    label: 'More',
    renderContent,
    triggerRef,
  }
}
