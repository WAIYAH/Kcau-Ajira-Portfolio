import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'
import Button from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, description, children, className }: ModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'relative z-10 w-full max-w-md rounded-surface border border-border bg-surface-raised p-6 shadow-elevate-lg',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-display text-lg font-semibold text-fg">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={onClose} aria-label="Close">
                <X size={16} strokeWidth={1.75} />
              </Button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
