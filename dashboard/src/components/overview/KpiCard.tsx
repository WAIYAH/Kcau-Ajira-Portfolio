import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Card from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import { cn } from '@/lib/cn'

type Accent = 'primary' | 'secondary' | 'success' | 'danger'

interface TrendVisual {
  type: 'trend'
  direction: 'up' | 'down' | 'flat'
  label: string
}

interface RingVisual {
  type: 'ring'
  percent: number
}

export interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  visual?: TrendVisual | RingVisual
  accent?: Accent
  to?: string
  index?: number
}

const accentClasses: Record<Accent, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
}

const trendClasses: Record<TrendVisual['direction'], string> = {
  up: 'text-success-ink',
  down: 'text-danger-ink',
  flat: 'text-fg-subtle',
}

export default function KpiCard({ icon: Icon, label, value, hint, visual, accent = 'primary', to, index = 0 }: KpiCardProps) {
  const body = (
    <Card variant={to ? 'interactive' : 'surface'} padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-control', accentClasses[accent])}>
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        {visual?.type === 'ring' && <ProgressRing percent={visual.percent} size={32} />}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums text-fg">{value}</p>
      <div className="mt-auto pt-1.5">
        {visual?.type === 'trend' && (
          <p className={cn('inline-flex items-center gap-1 text-xs font-medium', trendClasses[visual.direction])}>
            {visual.direction === 'up' && <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />}
            {visual.direction === 'down' && <ArrowDownRight size={13} strokeWidth={2} aria-hidden="true" />}
            {visual.label}
          </p>
        )}
        {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
      </div>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className="h-full"
    >
      {to ? (
        <Link
          to={to}
          className="block h-full"
          aria-label={[label, value, hint].filter(Boolean).join(', ')}
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  )
}
