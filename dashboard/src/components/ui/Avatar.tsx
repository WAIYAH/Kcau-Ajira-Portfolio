import { cn } from '@/lib/cn'

const GRADIENTS = [
  'from-indigo-500 to-cyan-400',
  'from-fuchsia-500 to-indigo-400',
  'from-amber-500 to-rose-400',
  'from-emerald-500 to-cyan-400',
  'from-rose-500 to-amber-400',
  'from-cyan-500 to-indigo-400',
]

function hashName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-2xl',
}

export interface AvatarProps {
  name: string
  src?: string | null
  size?: keyof typeof sizeClasses
  className?: string
}

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn('shrink-0 rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  const gradient = GRADIENTS[hashName(name || '?') % GRADIENTS.length]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-semibold text-white',
        gradient,
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name || '?')}
    </div>
  )
}
