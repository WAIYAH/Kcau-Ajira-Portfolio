import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'
import Button from './Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export default function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-raised shadow-elevate-lg',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 id={titleId} className="font-display text-lg font-semibold text-fg">
                {title}
              </h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
                <X size={16} strokeWidth={1.75} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
