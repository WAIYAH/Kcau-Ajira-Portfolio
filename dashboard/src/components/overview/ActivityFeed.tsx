import { Megaphone, ShieldCheck, type LucideIcon } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import type { FeedAnnouncement, AuditFeedItem } from '@/hooks/useOverviewData'

interface FeedRow {
  id: string
  icon: LucideIcon
  title: string
  meta: string
  time: string
  sortTime: number
}

interface ActivityFeedProps {
  announcements: FeedAnnouncement[]
  auditEntries: AuditFeedItem[]
}

function humanizeAction(action: string, table: string | null) {
  const readable = action.replace(/[._]/g, ' ')
  return table ? `${readable} · ${table}` : readable
}

export default function ActivityFeed({ announcements, auditEntries }: ActivityFeedProps) {
  const rows: FeedRow[] = [
    ...announcements.map((a) => ({
      id: `ann-${a.id}`,
      icon: Megaphone,
      title: a.title,
      meta: 'Announcement',
      time: a.created_at,
      sortTime: new Date(a.created_at).getTime(),
    })),
    ...auditEntries.map((e) => ({
      id: `audit-${e.id}`,
      icon: ShieldCheck,
      title: humanizeAction(e.action, e.target_table),
      meta: e.actorName ?? 'System',
      time: e.created_at,
      sortTime: new Date(e.created_at).getTime(),
    })),
  ]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 12)

  return (
    <Card padding="md">
      <h2 className="text-sm font-semibold text-fg">Recent activity</h2>
      {rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing yet"
          description="Announcements and admin actions will show up here."
          className="mt-3 border-none py-6"
        />
      ) : (
        <ul className="mt-3 space-y-1">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 rounded-control px-2 py-2 transition-colors hover:bg-fg/5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <row.icon size={14} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm capitalize text-fg">{row.title}</p>
                <p className="text-xs text-fg-subtle">{row.meta}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-fg-subtle">
                {formatDistanceToNowStrict(new Date(row.time), { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
