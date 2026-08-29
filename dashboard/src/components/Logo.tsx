import { cn } from '@/lib/cn'
import { useTheme } from '@/contexts/ThemeContext'

interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export default function Logo({ size = 36, showWordmark = true, className }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const src = resolvedTheme === 'dark' ? '/ajira-logo-dark.png' : '/ajira-logo.png'

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <img
        src={src}
        alt="KCA Ajira Club logo"
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-bold text-fg">KCA Ajira Club</p>
          <p className="truncate text-xs text-fg-muted">Member Dashboard</p>
        </div>
      )}
    </div>
  )
}
