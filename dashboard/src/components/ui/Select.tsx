import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { fieldClasses } from './Input'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, invalid, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        fieldClasses,
        'appearance-none pr-9',
        invalid && 'border-danger focus:ring-danger focus:border-danger',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      strokeWidth={1.75}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      aria-hidden="true"
    />
  </div>
))
Select.displayName = 'Select'

export default Select
