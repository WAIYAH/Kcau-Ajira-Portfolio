import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, X, Bell, Sun, Moon, Monitor, ChevronDown, User, ShieldCheck, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, type Theme } from '@/contexts/ThemeContext'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useNotificationSignals } from '@/hooks/useNotificationSignals'
import Avatar from '@/components/ui/Avatar'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import { cn } from '@/lib/cn'

const themeOptions: { value: Theme; icon: LucideIcon; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'Match system' },
]

interface HeaderProps {
  onOpenMobileNav: () => void
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const { profile, isAdmin, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const { results } = useGlobalSearch(query)
  const { count: notificationCount, items: notificationItems } = useNotificationSignals()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const accountItems: DropdownItem[] = [
    { label: 'My Profile', icon: User, onClick: () => navigate('/profile') },
    ...(isAdmin ? [{ label: 'Audit Log', icon: ShieldCheck, onClick: () => navigate('/settings/audit-log') }] : []),
    { label: 'Sign out', icon: LogOut, onClick: () => signOut(), danger: true },
  ]

  const notificationMenuItems: DropdownItem[] =
    notificationItems.length > 0
      ? notificationItems.map((n) => ({ label: n.label, onClick: () => navigate(n.to) }))
      : [{ label: "You're all caught up", onClick: () => {} }]

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-control p-2 text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg md:hidden"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <div className="relative flex-1 md:max-w-sm">
        <Search
          size={16}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
          placeholder="Search events, announcements…"
          aria-label="Search"
          className="h-10 w-full rounded-control border border-border bg-bg pl-9 pr-9 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle md:block">
            ⌘K
          </kbd>
        )}

        {searchFocused && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-control border border-border bg-surface-raised shadow-elevate-lg">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-fg-muted">No matches for “{query}”</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    navigate(r.to)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-fg/5"
                >
                  <span className="truncate">{r.label}</span>
                  <span className="shrink-0 text-xs text-fg-subtle">{r.sublabel}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center rounded-control border border-border bg-bg p-0.5 sm:flex">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-label={opt.label}
              aria-pressed={theme === opt.value}
              className={cn(
                'rounded-control p-1.5 transition-[color,background-color,transform] active:scale-90',
                theme === opt.value ? 'bg-primary-solid text-white' : 'text-fg-subtle hover:text-fg',
              )}
            >
              <opt.icon size={15} strokeWidth={1.75} />
            </button>
          ))}
        </div>

        <Dropdown
          align="end"
          triggerLabel={notificationCount > 0 ? `Notifications (${notificationCount} unread)` : 'Notifications'}
          trigger={
            <span className="relative flex h-10 w-10 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg">
              <Bell size={19} strokeWidth={1.75} aria-hidden="true" />
              {notificationCount > 0 && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-semibold text-white"
                  aria-hidden="true"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </span>
          }
          items={notificationMenuItems}
        />

        <Dropdown
          align="end"
          triggerLabel={`Account menu for ${profile?.full_name ?? 'your account'}`}
          trigger={
            <span className="flex items-center gap-2 rounded-control py-1 pl-1 pr-2 transition-colors hover:bg-fg/5">
              <Avatar name={profile?.full_name ?? '?'} src={profile?.avatar_url} size="sm" />
              <span className="hidden text-sm font-medium text-fg lg:block" aria-hidden="true">
                {profile?.full_name?.split(' ')[0]}
              </span>
              <ChevronDown size={14} strokeWidth={1.75} className="hidden text-fg-subtle lg:block" aria-hidden="true" />
            </span>
          }
          items={accountItems}
        />
      </div>
    </header>
  )
}
