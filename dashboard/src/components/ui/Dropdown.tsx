import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'

export interface DropdownItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  danger?: boolean
}

export interface DropdownDivider {
  divider: true
}

interface DropdownProps {
  trigger: ReactNode
  items: (DropdownItem | DropdownDivider)[]
  align?: 'start' | 'end'
  /** Required when `trigger` has no visible text (icon-only triggers like the notification bell). */
  triggerLabel?: string
}

function isDivider(item: DropdownItem | DropdownDivider): item is DropdownDivider {
  return 'divider' in item
}

export default function Dropdown({ trigger, items, align = 'end', triggerLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        className="flex items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-2 min-w-48 overflow-hidden rounded-control border border-border bg-surface-raised p-1 shadow-elevate-lg',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, i) =>
              isDivider(item) ? (
                <div key={`divider-${i}`} className="my-1 h-px bg-border" role="separator" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onClick()
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm transition-colors',
                    item.danger ? 'text-danger-ink hover:bg-danger/10' : 'text-fg hover:bg-fg/5',
                  )}
                >
                  {item.icon && <item.icon size={16} strokeWidth={1.75} aria-hidden="true" />}
                  {item.label}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
