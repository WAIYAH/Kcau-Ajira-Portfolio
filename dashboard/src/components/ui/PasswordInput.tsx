import { forwardRef, useState, type KeyboardEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import Input, { type InputProps } from './Input'

export type PasswordInputProps = Omit<InputProps, 'type'>

// Input with a show/hide toggle and a Caps Lock warning. The toggle is a real
// <button type="button"> (so it never submits the form) with aria-pressed, and
// the warning is announced politely, not as an error.
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, id, onKeyDown, onKeyUp, onBlur, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const [capsLock, setCapsLock] = useState(false)

    function checkCaps(e: KeyboardEvent<HTMLInputElement>) {
      // getModifierState is missing on some synthetic/older events.
      if (typeof e.getModifierState === 'function') setCapsLock(e.getModifierState('CapsLock'))
    }

    return (
      <div className={className}>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className="pr-10"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => {
              checkCaps(e)
              onKeyDown?.(e)
            }}
            onKeyUp={(e) => {
              checkCaps(e)
              onKeyUp?.(e)
            }}
            onBlur={(e) => {
              setCapsLock(false)
              onBlur?.(e)
            }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={id}
            title={visible ? 'Hide password' : 'Show password'}
            disabled={props.disabled}
            className={cn(
              'absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-control text-fg-subtle transition-colors',
              'hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {visible ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-1 text-xs font-medium text-secondary-ink empty:hidden">
          {capsLock ? 'Caps Lock is on' : ''}
        </p>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
