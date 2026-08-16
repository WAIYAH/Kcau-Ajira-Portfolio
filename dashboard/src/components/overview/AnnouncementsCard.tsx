import { format } from 'date-fns'
import { Megaphone } from 'lucide-react'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import type { FeedAnnouncement } from '@/hooks/useOverviewData'

export default function AnnouncementsCard({ announcements }: { announcements: FeedAnnouncement[] }) {
  return (
    <Card padding="md">
      <h2 className="text-sm font-semibold text-fg">Latest announcements</h2>
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" className="mt-3 border-none py-6" />
      ) : (
        <ul className="mt-3 space-y-4">
          {announcements.slice(0, 5).map((a) => (
            <li key={a.id}>
              <p className="text-sm font-medium text-fg">{a.title}</p>
              <p className="line-clamp-2 text-sm text-fg-muted">{a.body}</p>
              <p className="mt-1 text-xs text-fg-subtle">{format(new Date(a.created_at), 'MMM d, yyyy')}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
