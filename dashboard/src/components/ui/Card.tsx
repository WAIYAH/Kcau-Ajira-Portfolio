import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardVariant = 'surface' | 'raised' | 'interactive'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const variantClasses: Record<CardVariant, string> = {
  surface: 'shadow-elevate-xs',
  raised: 'shadow-elevate-md',
  interactive:
    'shadow-elevate-xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-elevate-md hover:border-border-strong',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'surface', padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-surface border border-border bg-surface',
        paddingClasses[padding],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export default Card
