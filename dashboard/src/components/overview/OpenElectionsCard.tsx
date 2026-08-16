import { differenceInCalendarDays } from 'date-fns'
import { Vote } from 'lucide-react'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import type { OpenElection } from '@/hooks/useOverviewData'

export default function OpenElectionsCard({ elections }: { elections: OpenElection[] }) {
  return (
    <Card padding="md">
      <h2 className="text-sm font-semibold text-fg">Open elections</h2>
      {elections.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No open elections"
          description="You'll see them here as soon as voting opens."
          className="mt-3 border-none py-6"
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {elections.map((election) => {
            const daysLeft = differenceInCalendarDays(new Date(election.closes_at), new Date())
            const closingSoon = daysLeft <= 3
            return (
              <li key={election.id} className="flex items-center justify-between gap-3 rounded-control p-2 transition-colors hover:bg-fg/5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
                    <Vote size={16} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <p className="truncate text-sm font-medium text-fg">{election.title}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                    closingSoon ? 'bg-danger/10 text-danger-ink' : 'bg-fg/5 text-fg-muted',
                  )}
                >
                  {daysLeft <= 0 ? 'Closes today' : `Closes in ${daysLeft}d`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
