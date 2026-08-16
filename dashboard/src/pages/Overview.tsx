import { differenceInCalendarDays } from 'date-fns'
import {
  Wallet,
  CalendarDays,
  Vote,
  GraduationCap,
  Users,
  UserCheck,
  Inbox,
  Activity,
  PiggyBank,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOverviewData } from '@/hooks/useOverviewData'
import { formatKes } from '@/lib/format'
import HeroBanner from '@/components/overview/HeroBanner'
import KpiCard, { type KpiCardProps } from '@/components/overview/KpiCard'
import IncomeExpenseChart from '@/components/overview/IncomeExpenseChart'
import ActivityFeed from '@/components/overview/ActivityFeed'
import UpcomingEventsCard from '@/components/overview/UpcomingEventsCard'
import OpenElectionsCard from '@/components/overview/OpenElectionsCard'
import AnnouncementsCard from '@/components/overview/AnnouncementsCard'
import OverviewSkeleton from '@/components/overview/OverviewSkeleton'

function buildStatusLine(isStaff: boolean, data: ReturnType<typeof useOverviewData>) {
  if (isStaff) {
    const parts: string[] = []
    if (data.pendingApprovals) parts.push(`${data.pendingApprovals} pending approval${data.pendingApprovals === 1 ? '' : 's'}`)
    if (data.newInquiries) parts.push(`${data.newInquiries} new inquir${data.newInquiries === 1 ? 'y' : 'ies'}`)
    return parts.length > 0 ? `${parts.join(' · ')} need your attention.` : "Everything's running smoothly."
  }
  const parts: string[] = []
  if (data.upcomingEvents.length) parts.push(`${data.upcomingEvents.length} upcoming event${data.upcomingEvents.length === 1 ? '' : 's'}`)
  if (data.openElections.length) parts.push(`${data.openElections.length} open election${data.openElections.length === 1 ? '' : 's'}`)
  return parts.length > 0 ? `You have ${parts.join(' and ')}.` : "Here's what's happening in the club right now."
}

export default function Overview() {
  const { profile, isStaff, isAdmin } = useAuth()
  const data = useOverviewData()

  if (data.loading) return <OverviewSkeleton />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const statusLine = buildStatusLine(isStaff, data)

  const earliestElection = data.openElections[0]
  const earliestElectionDays = earliestElection ? differenceInCalendarDays(new Date(earliestElection.closes_at), new Date()) : null

  const balanceDelta = data.balanceDeltaThisMonth
  const balanceDirection: 'up' | 'down' | 'flat' = balanceDelta > 0 ? 'up' : balanceDelta < 0 ? 'down' : 'flat'

  const cards: KpiCardProps[] = [
    {
      icon: Wallet,
      label: 'Club Balance',
      value: data.balance === null ? '—' : formatKes(data.balance),
      accent: 'primary',
      visual:
        balanceDelta !== 0
          ? { type: 'trend', direction: balanceDirection, label: `${balanceDelta > 0 ? '+' : ''}${formatKes(balanceDelta)} this month` }
          : undefined,
      hint: balanceDelta === 0 ? 'No change this month' : undefined,
    },
    {
      icon: CalendarDays,
      label: 'Upcoming Events',
      value: String(data.upcomingEvents.length),
      accent: 'primary',
    },
    {
      icon: Vote,
      label: 'Open Elections',
      value: String(data.openElections.length),
      accent: 'primary',
      hint: earliestElectionDays !== null && earliestElectionDays <= 3 ? `Closes in ${Math.max(earliestElectionDays, 0)}d` : undefined,
    },
    {
      icon: GraduationCap,
      label: 'My Learning Progress',
      value: data.myLearningProgressPct === null ? '—' : `${data.myLearningProgressPct}%`,
      accent: 'success',
      visual: data.myLearningProgressPct !== null ? { type: 'ring', percent: data.myLearningProgressPct } : undefined,
    },
  ]

  if (isStaff) {
    cards.push(
      {
        icon: Users,
        label: 'Active Members',
        value: data.activeMembers === null ? '—' : String(data.activeMembers),
        accent: 'primary',
        visual:
          data.activeMembersNewThisMonth > 0
            ? { type: 'trend', direction: 'up', label: `+${data.activeMembersNewThisMonth} this month` }
            : undefined,
      },
      {
        icon: UserCheck,
        label: 'Pending Approvals',
        value: data.pendingApprovals === null ? '—' : String(data.pendingApprovals),
        accent: data.pendingApprovals ? 'secondary' : 'primary',
        hint: data.pendingApprovals ? 'Needs your review' : undefined,
        to: '/members',
      },
      {
        icon: Inbox,
        label: 'New Inquiries',
        value: data.newInquiries === null ? '—' : String(data.newInquiries),
        accent: data.newInquiries ? 'secondary' : 'primary',
        hint: data.newInquiries ? 'From the website' : undefined,
        to: '/communications/inbox',
      },
      {
        icon: Activity,
        label: 'Event Attendance',
        value: data.eventAttendanceRate === null ? '—' : `${data.eventAttendanceRate}%`,
        accent: 'success',
        hint: 'Last 3 events',
      },
      {
        icon: PiggyBank,
        label: 'Dues Collection',
        value: data.duesCollectionRate === null ? '—' : `${data.duesCollectionRate}%`,
        accent: 'success',
        hint: 'All recorded dues',
        to: '/finance/dues',
      },
      {
        icon: Sparkles,
        label: 'Engagement Score',
        value: data.engagementScore === null ? '—' : `${data.engagementScore}%`,
        accent: 'primary',
        hint: 'RSVPs + learning activity',
      },
    )
  }

  const chartData = data.monthlyTotals.map((m) => ({ ...m, net: m.income - m.expense }))

  return (
    <div className="space-y-6">
      <HeroBanner firstName={firstName} statusLine={statusLine} isStaff={isStaff} pendingApprovals={data.pendingApprovals} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, i) => (
          <KpiCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {isStaff && <IncomeExpenseChart data={chartData} />}

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingEventsCard events={data.upcomingEvents} />
        <OpenElectionsCard elections={data.openElections} />
      </div>

      {isStaff ? (
        <ActivityFeed announcements={data.announcements} auditEntries={isAdmin ? data.auditEntries : []} />
      ) : (
        <AnnouncementsCard announcements={data.announcements} />
      )}
    </div>
  )
}
