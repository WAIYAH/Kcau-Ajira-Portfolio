import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getPasswordStrength, passwordRules } from '@/lib/password'

const barColor = ['bg-border', 'bg-danger', 'bg-secondary', 'bg-success', 'bg-success'] as const
const labelColor = ['text-fg-subtle', 'text-danger-ink', 'text-secondary-ink', 'text-success-ink', 'text-success-ink'] as const

// Four-segment bar plus a live checklist of the rules in lib/password.ts.
// Pass the same `id` you reference from the password input's aria-describedby.
export default function PasswordStrengthMeter({ id, password }: { id: string; password: string }) {
  const { level, label, passed } = getPasswordStrength(password)

  return (
    <div id={id} className="mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn('h-1.5 flex-1 rounded-full transition-colors duration-200', i <= level ? barColor[level] : 'bg-border')}
            />
          ))}
        </div>
        <span className={cn('w-14 text-right text-xs font-medium', labelColor[level])} aria-live="polite">
          {label && <span className="sr-only">Password strength: </span>}
          {label}
        </span>
      </div>

      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {passwordRules.map((rule) => {
          const ok = passed[rule.id]
          return (
            <li key={rule.id} className={cn('flex items-center gap-1.5', ok ? 'text-success-ink' : 'text-fg-subtle')}>
              {ok ? (
                <Check size={12} strokeWidth={3} aria-hidden="true" className="shrink-0" />
              ) : (
                <Circle size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              )}
              {rule.label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
