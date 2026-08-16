import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/cn'
import { memberLinks, staffLinks, adminLinks, type NavLinkItem } from './navConfig'

interface NavSectionProps {
  title: string
  links: NavLinkItem[]
  collapsed: boolean
  onNavigate?: () => void
}

function NavSection({ title, links, collapsed, onNavigate }: NavSectionProps) {
  return (
    <div>
      {!collapsed && <p className="px-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</p>}
      <div className={cn('space-y-1', !collapsed && 'mt-2')}>
        {links.map((link) => {
          const linkEl = (
            <NavLink
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive ? 'bg-primary/10 text-primary shadow-glow-primary' : 'text-fg-muted hover:bg-fg/5 hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <link.icon size={18} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </>
              )}
            </NavLink>
          )

          return collapsed ? (
            <Tooltip key={link.to} label={link.label} side="right" className="block w-full">
              {linkEl}
            </Tooltip>
          ) : (
            <div key={link.to}>{linkEl}</div>
          )
        })}
      </div>
    </div>
  )
}

interface SidebarNavProps {
  collapsed: boolean
  onNavigate?: () => void
  showCollapseToggle?: boolean
  onToggleCollapse?: () => void
}

export default function SidebarNav({ collapsed, onNavigate, showCollapseToggle = false, onToggleCollapse }: SidebarNavProps) {
  const { profile, isStaff, isAdmin, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-2 border-b border-border px-4 py-4', collapsed && 'justify-center px-2')}>
        <Logo size={32} showWordmark={!collapsed} />
        {showCollapseToggle && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto rounded-control p-1.5 text-fg-subtle transition-colors hover:bg-fg/5 hover:text-fg"
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavSection title="Member" links={memberLinks} collapsed={collapsed} onNavigate={onNavigate} />
        {isStaff && <NavSection title="Leadership" links={staffLinks} collapsed={collapsed} onNavigate={onNavigate} />}
        {isAdmin && <NavSection title="Admin" links={adminLinks} collapsed={collapsed} onNavigate={onNavigate} />}
      </nav>

      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <Tooltip label={profile?.full_name ?? 'Account'} side="right">
            <Avatar name={profile?.full_name ?? '?'} size="sm" />
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 rounded-control p-2">
            <Avatar name={profile?.full_name ?? '?'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{profile?.full_name}</p>
              <p className="truncate text-xs capitalize text-fg-subtle">{profile?.role}</p>
            </div>
            <Tooltip label="Sign out" side="top">
              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="rounded-control p-2 text-fg-subtle transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <LogOut size={16} strokeWidth={1.75} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
