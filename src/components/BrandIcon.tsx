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

export function BrandIcon({ className = 'bg-brand-primary', size = 'w-8 h-8' }: BrandIconProps) {
  return <div className={`${size} ${className}`} style={maskStyle} />
}
