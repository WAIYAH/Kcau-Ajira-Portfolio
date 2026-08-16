import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { fieldClasses } from './Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClasses, 'h-auto min-h-24 resize-y py-2', invalid && 'border-danger focus:ring-danger focus:border-danger', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export default Textarea
