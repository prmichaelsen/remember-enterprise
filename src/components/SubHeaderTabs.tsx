/**
 * SubHeaderTabs — generic tab bar for sub-navigation within conversation views.
 * Supports default and ghost (purple) variants.
 */

import type { ReactNode } from 'react'

export interface SubHeaderTab {
  id: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'ghost'
}

interface SubHeaderTabsProps {
  tabs: SubHeaderTab[]
  activeId: string
  onSelect: (id: string) => void
}

export function SubHeaderTabs({ tabs, activeId, onSelect }: SubHeaderTabsProps) {
  return (
    <div className="border-b border-border-default">
      <div className="flex px-4 min-w-min">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id
          const isGhost = tab.variant === 'ghost'
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                isActive
                  ? isGhost
                    ? 'border-purple-500 text-purple-300'
                    : 'border-brand-primary text-text-primary'
                  : isGhost
                    ? 'border-transparent text-text-muted hover:text-purple-300'
                    : 'border-transparent text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
