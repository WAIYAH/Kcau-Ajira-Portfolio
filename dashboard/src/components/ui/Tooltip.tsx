import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: TooltipSide
  disabled?: boolean
  className?: string
}

const GAP = 8

const translateBySide: Record<TooltipSide, string> = {
  right: '-translate-y-1/2',
  left: '-translate-x-full -translate-y-1/2',
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
}

/**
 * Portaled to document.body and positioned from the trigger's live
 * getBoundingClientRect(), rather than absolutely positioned inside the
 * trigger's own DOM subtree. A same-subtree tooltip gets silently clipped by
 * any scrollable ancestor: setting overflow-y (e.g. the sidebar nav's
 * overflow-y-auto) computes the *other* axis to auto too per the CSS
 * overflow spec, so overflow-x ends up clipped even though it was never set
 * explicitly. Portaling sidesteps that entirely — same approach as
 * Modal/Drawer/Dropdown in this folder.
 */
export default function Tooltip({ label, children, side = 'right', disabled = false, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<number | null>(null)

  function show() {
    if (disabled) return
    timeoutRef.current = window.setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const bySide: Record<TooltipSide, { top: number; left: number }> = {
        right: { top: rect.top + rect.height / 2, left: rect.right + GAP },
        left: { top: rect.top + rect.height / 2, left: rect.left - GAP },
        top: { top: rect.top - GAP, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + GAP, left: rect.left + rect.width / 2 },
      }
      setCoords(bySide[side])
      setVisible(true)
    }, 200)
  }

  function hide() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <span
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {!disabled &&
        createPortal(
          <span
            role="tooltip"
            style={coords ? { position: 'fixed', top: coords.top, left: coords.left } : undefined}
            className={cn(
              'pointer-events-none z-50 whitespace-nowrap rounded-control bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-elevate-md transition-opacity duration-150',
              translateBySide[side],
              visible && coords ? 'opacity-100' : 'opacity-0',
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
