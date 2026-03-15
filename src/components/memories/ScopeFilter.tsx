/**
 * ScopeFilter — pill-style filter buttons for memory scope.
 * All, Personal, Groups, Spaces.
 */

import { Globe, Users, User, Layers } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import type { MemoryScope } from '@/types/memories'

type FilterScope = MemoryScope | 'all'

interface ScopeFilterProps {
  value: FilterScope
  onChange: (scope: FilterScope) => void
}

const FILTER_OPTIONS: Array<{
  value: FilterScope
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'groups', label: 'Groups', icon: Users },
  { value: 'spaces', label: 'Spaces', icon: Globe },
]

export function ScopeFilter({ value, onChange }: ScopeFilterProps) {
  const t = useTheme()

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {FILTER_OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isSelected
                ? 'bg-brand-primary text-white'
                : `${t.buttonGhost} border border-border-default`
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
