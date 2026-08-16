import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import type { UpcomingEvent } from '@/hooks/useOverviewData'

export default function UpcomingEventsCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card padding="md">
      <h2 className="text-sm font-semibold text-fg">Upcoming activities</h2>
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events"
          description="New events will appear here once they're scheduled."
          className="mt-3 border-none py-6"
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((event) => {
            const date = new Date(event.starts_at)
            return (
              <li key={event.id} className="flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-fg/5">
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-control bg-primary/10 py-1.5 text-primary">
                  <span className="text-[10px] font-semibold uppercase leading-none">{format(date, 'MMM')}</span>
                  <span className="font-display text-lg font-bold leading-none">{format(date, 'd')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{event.title}</p>
                  {event.location && <p className="truncate text-xs text-fg-subtle">{event.location}</p>}
                </div>
                <p className="shrink-0 whitespace-nowrap text-xs text-fg-muted">{format(date, 'HH:mm')}</p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
