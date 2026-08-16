import { Link } from 'react-router-dom'
import { CalendarPlus, Vote, UserCheck, Megaphone, type LucideIcon } from 'lucide-react'

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

interface QuickAction {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
}

interface HeroBannerProps {
  firstName: string
  statusLine: string
  isStaff: boolean
  pendingApprovals: number | null
}

export default function HeroBanner({ firstName, statusLine, isStaff, pendingApprovals }: HeroBannerProps) {
  const greeting = getGreeting(new Date().getHours())

  const actions: QuickAction[] = [
    { label: 'Create Event', to: '/events', icon: CalendarPlus },
    { label: 'Start Election', to: '/voting', icon: Vote },
    { label: 'Approve Members', to: '/members', icon: UserCheck, badge: pendingApprovals ?? undefined },
    { label: 'Post Announcement', to: '/communications/announcements', icon: Megaphone },
  ]

  return (
    <div className="relative overflow-hidden rounded-surface border border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">{statusLine}</p>
        </div>

        {isStaff && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="group relative inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-fg shadow-elevate-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevate-sm"
              >
                <action.icon size={15} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
                {action.label}
                {!!action.badge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                    {action.badge > 9 ? '9+' : action.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
