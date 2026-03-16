import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/lib/theming'
import { BrandIcon } from '@/components/BrandIcon'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})

function DemoPage() {
  const t = useTheme()

  return (
    <div className={`flex-1 p-8 ${t.page}`}>
      <h1 className={`text-2xl font-bold mb-8 ${t.textPrimary}`}>BrandIcon Demo</h1>

      <div className="flex flex-wrap gap-8 items-end">
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>brand-primary</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-brand-accent" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>brand-accent</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-brand-secondary" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>brand-secondary</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-brand-success" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>brand-success</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-brand-danger" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>brand-danger</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-text-primary" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>text-primary</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <BrandIcon className="bg-text-secondary" size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>text-secondary</span>
        </div>
      </div>

      <h2 className={`text-lg font-semibold mt-12 mb-4 ${t.textPrimary}`}>Sizes</h2>
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-6 h-6" />
          <span className={`text-xs ${t.textMuted}`}>24px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-8 h-8" />
          <span className={`text-xs ${t.textMuted}`}>32px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-12 h-12" />
          <span className={`text-xs ${t.textMuted}`}>48px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-16 h-16" />
          <span className={`text-xs ${t.textMuted}`}>64px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BrandIcon size="w-24 h-24" />
          <span className={`text-xs ${t.textMuted}`}>96px</span>
        </div>
      </div>
    </div>
  )
}
