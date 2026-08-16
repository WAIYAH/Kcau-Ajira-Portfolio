import { cn } from '@/lib/cn'

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-fg/10', className)} aria-hidden="true" />
}
