import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: TooltipSide
  disabled?: boolean
}

const sideClasses: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
}

export default function Tooltip({ label, children, side = 'right', disabled = false }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  function show() {
    if (disabled) return
    timeoutRef.current = window.setTimeout(() => setVisible(true), 200)
  }

  function hide() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {!disabled && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-control bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-elevate-md transition-opacity duration-150',
            visible ? 'opacity-100' : 'opacity-0',
            sideClasses[side],
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
