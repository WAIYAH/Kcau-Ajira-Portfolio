import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'

// Form-level message for the auth screens. Errors use role="alert" so screen
// readers announce them the moment a submit fails; success uses role="status".
export default function FormAlert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success'
  children: ReactNode
  className?: string
}) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-control px-3 py-2.5 text-sm',
        tone === 'error' ? 'bg-danger/10 text-danger-ink' : 'bg-success/10 text-success-ink',
        className,
      )}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
