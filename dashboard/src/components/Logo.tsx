import { cn } from '@/lib/cn'

interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export default function Logo({ size = 36, showWordmark = true, className }: LogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        KA
      </div>
      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-bold text-fg">KCA Ajira Club</p>
          <p className="truncate text-xs text-fg-muted">Member Dashboard</p>
        </div>
      )}
    </div>
  )
}
