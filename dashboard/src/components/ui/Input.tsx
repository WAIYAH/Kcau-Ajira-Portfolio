import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const fieldClasses =
  'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50'

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(fieldClasses, invalid && 'border-danger focus:ring-danger focus:border-danger', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
))
Input.displayName = 'Input'

export default Input
