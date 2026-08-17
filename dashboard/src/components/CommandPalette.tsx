import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { buildNavItems, filterNavItems } from '@/lib/commandPalette'
import { cn } from '@/lib/cn'

interface PaletteEntry {
  id: string
  label: string
  sublabel: string
  to: string
  icon?: LucideIcon
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  isStaff: boolean
  isAdmin: boolean
}

// A real ⌘K command palette: fuzzy-jump to any route the sidebar would show
// (role-gated the same way), plus the same live record search the header
// search box already does (events/announcements/opportunities/members),
// merged into one keyboard-navigable list. Deferred in ROADMAP.md Tier 4
// until there was enough to search/act on -- Opportunities (Phase 2) and
// persisted notifications (Phase 4) since made that case.
export default function CommandPalette({ open, onClose, isStaff, isAdmin }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const navigate = useNavigate()
  const { results } = useGlobalSearch(query, isStaff)

  const navItems = useMemo(() => buildNavItems(isStaff, isAdmin), [isStaff, isAdmin])
  const matchedNavItems = useMemo(() => filterNavItems(navItems, query), [navItems, query])

  const entries: PaletteEntry[] = useMemo(() => {
    const navEntries: PaletteEntry[] = matchedNavItems.map((item) => ({
      id: item.id,
      label: item.label,
      sublabel: item.section,
      to: item.to,
      icon: item.icon,
    }))
    if (query.trim().length < 2) return navEntries
    const resultEntries: PaletteEntry[] = results.map((r) => ({ id: r.id, label: r.label, sublabel: r.sublabel, to: r.to }))
    return [...navEntries, ...resultEntries]
  }, [matchedNavItems, results, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Wait a frame so the portal has mounted before focusing.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [entries.length])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, entries.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const entry = entries[activeIndex]
        if (entry) {
          navigate(entry.to)
          onClose()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, entries, activeIndex, navigate, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-surface border border-border bg-surface-raised shadow-elevate-lg"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={entries.length > 0}
                aria-controls={listboxId}
                aria-autocomplete="list"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isStaff ? 'Jump to a page, event, member…' : 'Jump to a page or event…'}
                className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle sm:block">
                Esc
              </kbd>
            </div>

            <ul id={listboxId} role="listbox" className="max-h-80 overflow-y-auto p-2">
              {entries.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-fg-muted">No matches{query ? ` for "${query}"` : ''}</li>
              ) : (
                entries.map((entry, index) => (
                  <li key={entry.id} role="option" aria-selected={index === activeIndex}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        navigate(entry.to)
                        onClose()
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm transition-colors',
                        index === activeIndex ? 'bg-primary/10 text-primary' : 'text-fg hover:bg-fg/5',
                      )}
                    >
                      {entry.icon ? (
                        <entry.icon size={16} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1 truncate">{entry.label}</span>
                      <span className="shrink-0 text-xs text-fg-subtle">{entry.sublabel}</span>
                      {index === activeIndex && (
                        <CornerDownLeft size={13} strokeWidth={1.75} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
