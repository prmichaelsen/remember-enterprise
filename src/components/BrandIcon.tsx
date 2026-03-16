const maskStyle: React.CSSProperties = {
  maskImage: `url('/memory_cloud_icon_subtracted.svg')`,
  maskSize: 'contain',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskImage: `url('/memory_cloud_icon_subtracted.svg')`,
  WebkitMaskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
}

interface BrandIconProps {
  className?: string
  size?: string
}

export function BrandIcon({ className, size }: BrandIconProps) {
  const hasBg = className?.includes('bg-')
  const hasSize = className?.includes('w-') || className?.includes('h-')
  const bgClass = hasBg ? '' : 'bg-current'
  const sizeClass = hasSize ? '' : (size ?? 'w-8 h-8')

  return (
    <div style={{transform: 'scale(1.5)'}}>
      <div className={`inline-block shrink-0 ${bgClass} ${sizeClass} ${className ?? ''}`} style={maskStyle} />
    </div>
  )
}
