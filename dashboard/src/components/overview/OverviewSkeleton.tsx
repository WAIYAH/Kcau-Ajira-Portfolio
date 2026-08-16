import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Card padding="lg">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} padding="md">
            <Skeleton className="h-10 w-10 rounded-control" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-16" />
          </Card>
        ))}
      </div>

      <Card padding="md">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-64 w-full" />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="md">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </Card>
        <Card padding="md">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </Card>
      </div>
    </div>
  )
}
