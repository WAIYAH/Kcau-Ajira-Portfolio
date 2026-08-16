import { useEffect, useState } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface MonthlyTotal {
  month: string
  income: number
  expense: number
}

export interface UpcomingEvent {
  id: string
  title: string
  starts_at: string
  location: string | null
  category: string | null
}

export interface OpenElection {
  id: string
  title: string
  closes_at: string
}

export interface FeedAnnouncement {
  id: string
  title: string
  body: string
  created_at: string
}

export interface AuditFeedItem {
  id: string
  action: string
  target_table: string | null
  created_at: string
  actorName: string | null
}

export interface OverviewData {
  loading: boolean

  balance: number | null
  balanceDeltaThisMonth: number

  upcomingEvents: UpcomingEvent[]
  openElections: OpenElection[]
  announcements: FeedAnnouncement[]
  monthlyTotals: MonthlyTotal[]

  // Staff-only
  activeMembers: number | null
  activeMembersNewThisMonth: number
  pendingApprovals: number | null
  newInquiries: number | null
  eventAttendanceRate: number | null
  duesCollectionRate: number | null
  engagementScore: number | null
  auditEntries: AuditFeedItem[]

  // Member-only
  myLearningProgressPct: number | null
}

const EMPTY: OverviewData = {
  loading: true,
  balance: null,
  balanceDeltaThisMonth: 0,
  upcomingEvents: [],
  openElections: [],
  announcements: [],
  monthlyTotals: [],
  activeMembers: null,
  activeMembersNewThisMonth: 0,
  pendingApprovals: null,
  newInquiries: null,
  eventAttendanceRate: null,
  duesCollectionRate: null,
  engagementScore: null,
  auditEntries: [],
  myLearningProgressPct: null,
}

export function useOverviewData(): OverviewData {
  const { profile, isStaff, isAdmin } = useAuth()
  const [data, setData] = useState<OverviewData>(EMPTY)

  useEffect(() => {
    if (!profile) return
    let active = true

    async function load() {
      if (!profile) return
      const now = new Date()
      const monthStart = startOfMonth(now)

      const [balanceRes, eventsRes, electionsRes, announcementsRes, txRes] = await Promise.all([
        supabase.from('club_balance').select('balance').single(),
        supabase
          .from('events')
          .select('id, title, starts_at, location, category')
          .gte('starts_at', now.toISOString())
          .order('starts_at', { ascending: true })
          .limit(5),
        supabase.from('elections').select('id, title, closes_at').eq('status', 'open').order('closes_at', { ascending: true }).limit(3),
        supabase.from('announcements').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(8),
        supabase
          .from('transactions')
          .select('type, amount, occurred_at')
          .gte('occurred_at', format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')),
      ])

      const monthlyTotals: MonthlyTotal[] = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i)
        return { month: format(d, 'MMM'), income: 0, expense: 0 }
      })
      for (const t of txRes.data ?? []) {
        const label = format(new Date(t.occurred_at), 'MMM')
        const bucket = monthlyTotals.find((b) => b.month === label)
        if (!bucket) continue
        if (t.type === 'income') bucket.income += Number(t.amount)
        else bucket.expense += Number(t.amount)
      }
      const currentMonthBucket = monthlyTotals[monthlyTotals.length - 1]
      const balanceDeltaThisMonth = currentMonthBucket ? currentMonthBucket.income - currentMonthBucket.expense : 0

      let staffExtras: Partial<OverviewData> = {}
      if (isStaff) {
        const [
          activeRes,
          newActiveRes,
          pendingRes,
          inquiriesRes,
          recentEventsRes,
          duesRes,
          resourceCountRes,
          doneCountRes,
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('joined_at', monthStart.toISOString()),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('events').select('id').lte('starts_at', now.toISOString()).order('starts_at', { ascending: false }).limit(3),
          supabase.from('membership_dues').select('amount_due, amount_paid'),
          supabase.from('learning_resources').select('id', { count: 'exact', head: true }),
          supabase.from('learning_progress').select('id', { count: 'exact', head: true }).eq('status', 'done'),
        ])

        const recentEventIds = (recentEventsRes.data ?? []).map((e) => e.id)
        let eventAttendanceRate: number | null = null
        if (recentEventIds.length > 0) {
          const rsvpRes = await supabase.from('event_rsvps').select('status').in('event_id', recentEventIds)
          const going = (rsvpRes.data ?? []).filter((r) => r.status === 'going').length
          const denominator = (activeRes.count ?? 0) * recentEventIds.length
          eventAttendanceRate = denominator > 0 ? Math.min(100, Math.round((going / denominator) * 100)) : null
        }

        const duesTotals = (duesRes.data ?? []).reduce(
          (acc, row) => ({ due: acc.due + Number(row.amount_due), paid: acc.paid + Number(row.amount_paid) }),
          { due: 0, paid: 0 },
        )
        const duesCollectionRate = duesTotals.due > 0 ? Math.min(100, Math.round((duesTotals.paid / duesTotals.due) * 100)) : null

        const totalResources = resourceCountRes.count ?? 0
        const activeMembers = activeRes.count ?? 0
        const learningRate =
          totalResources > 0 && activeMembers > 0
            ? Math.min(100, Math.round(((doneCountRes.count ?? 0) / (totalResources * activeMembers)) * 100))
            : null

        const engagementScore =
          eventAttendanceRate !== null && learningRate !== null
            ? Math.round((eventAttendanceRate + learningRate) / 2)
            : (eventAttendanceRate ?? learningRate)

        let auditEntries: AuditFeedItem[] = []
        if (isAdmin) {
          const auditRes = await supabase
            .from('audit_log')
            .select('id, action, target_table, created_at, actor:profiles!actor_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(8)
          const auditRows = (auditRes.data ?? []) as unknown as {
            id: string
            action: string
            target_table: string | null
            created_at: string
            actor: { full_name: string } | null
          }[]
          auditEntries = auditRows.map((row) => ({
            id: row.id,
            action: row.action,
            target_table: row.target_table,
            created_at: row.created_at,
            actorName: row.actor?.full_name ?? null,
          }))
        }

        staffExtras = {
          activeMembers,
          activeMembersNewThisMonth: newActiveRes.count ?? 0,
          pendingApprovals: pendingRes.count ?? 0,
          newInquiries: inquiriesRes.count ?? 0,
          eventAttendanceRate,
          duesCollectionRate,
          engagementScore,
          auditEntries,
        }
      }

      let myLearningProgressPct: number | null = null
      const [myDoneRes, allResourceCountRes] = await Promise.all([
        supabase.from('learning_progress').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'done'),
        supabase.from('learning_resources').select('id', { count: 'exact', head: true }),
      ])
      const totalResources = allResourceCountRes.count ?? 0
      myLearningProgressPct = totalResources > 0 ? Math.round(((myDoneRes.count ?? 0) / totalResources) * 100) : null

      if (!active) return
      setData({
        loading: false,
        balance: balanceRes.data ? Number(balanceRes.data.balance) : 0,
        balanceDeltaThisMonth,
        upcomingEvents: eventsRes.data ?? [],
        openElections: electionsRes.data ?? [],
        announcements: announcementsRes.data ?? [],
        monthlyTotals,
        activeMembers: null,
        activeMembersNewThisMonth: 0,
        pendingApprovals: null,
        newInquiries: null,
        eventAttendanceRate: null,
        duesCollectionRate: null,
        engagementScore: null,
        auditEntries: [],
        myLearningProgressPct,
        ...staffExtras,
      })
    }

    load()
    return () => {
      active = false
    }
  }, [profile, isStaff, isAdmin])

  return data
}
