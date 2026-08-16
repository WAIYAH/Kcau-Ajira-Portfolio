import type { ComponentPropsWithoutRef, ElementType, ReactElement } from 'react'
import { cn } from '@/lib/cn'

type CardVariant = 'surface' | 'raised' | 'interactive'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardOwnProps<T extends ElementType> {
  as?: T
  variant?: CardVariant
  padding?: CardPadding
}

export type CardProps<T extends ElementType = 'div'> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>

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

// Polymorphic (`as="form"`, etc.) rather than forwardRef — nothing in this
// codebase forwards a ref into Card, and the generic-plus-forwardRef typing
// isn't worth the complexity until something actually needs it.
export default function Card<T extends ElementType = 'div'>({
  as,
  className,
  variant = 'surface',
  padding = 'md',
  ...props
}: CardProps<T>): ReactElement {
  const Component = as || 'div'
  return (
    <Component
      className={cn(
        'rounded-surface border border-border bg-surface',
        paddingClasses[padding],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
