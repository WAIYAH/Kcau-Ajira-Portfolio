import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfMonth, subMonths } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { formatKes } from '../lib/format'
import StatCard from '../components/StatCard'

// Chart colors: reference palette slots 1 (blue) and 2 (orange), an
// already-validated adjacent pair (CVD ΔE 9.1 light) — see the dataviz skill.
const CHART_INCOME = '#2a78d6'
const CHART_EXPENSE = '#eb6834'
const CHART_GRID = '#e1e0d9'
const CHART_AXIS = '#c3c2b7'
const CHART_MUTED_INK = '#898781'

interface MonthlyTotal {
  month: string
  income: number
  expense: number
}

interface UpcomingEvent {
  id: string
  title: string
  starts_at: string
  location: string | null
}

interface OpenElection {
  id: string
  title: string
  closes_at: string
}

interface Announcement {
  id: string
  title: string
  body: string
  created_at: string
}

export default function Overview() {
  const { profile, isStaff } = useAuth()

  const [balance, setBalance] = useState<number | null>(null)
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [elections, setElections] = useState<OpenElection[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [newInquiryCount, setNewInquiryCount] = useState<number | null>(null)
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([])

  useEffect(() => {
    supabase
      .from('club_balance')
      .select('balance')
      .single()
      .then(({ data }) => setBalance(data ? Number(data.balance) : 0))

    supabase
      .from('events')
      .select('id, title, starts_at, location')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5)
      .then(({ data }) => setEvents(data ?? []))

    supabase
      .from('elections')
      .select('id, title, closes_at')
      .eq('status', 'open')
      .order('closes_at', { ascending: true })
      .limit(3)
      .then(({ data }) => setElections(data ?? []))

    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setAnnouncements(data ?? []))

    if (isStaff) {
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .then(({ count }) => setMemberCount(count ?? 0))

      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => setPendingCount(count ?? 0))

      supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
        .then(({ count }) => setNewInquiryCount(count ?? 0))

      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))
      supabase
        .from('transactions')
        .select('type, amount, occurred_at')
        .gte('occurred_at', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .then(({ data }) => {
          const buckets: MonthlyTotal[] = Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(new Date(), 5 - i)
            return { month: format(d, 'MMM'), income: 0, expense: 0 }
          })
          for (const t of data ?? []) {
            const label = format(new Date(t.occurred_at), 'MMM')
            const bucket = buckets.find((b) => b.month === label)
            if (!bucket) continue
            if (t.type === 'income') bucket.income += Number(t.amount)
            else bucket.expense += Number(t.amount)
          }
          setMonthlyTotals(buckets)
        })
    }
  }, [isStaff])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening in the club right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Club balance" value={balance === null ? '—' : `KES ${balance.toLocaleString()}`} />
        <StatCard label="Upcoming events" value={String(events.length)} />
        <StatCard label="Open elections" value={String(elections.length)} />
        {isStaff && <StatCard label="Active members" value={memberCount === null ? '—' : String(memberCount)} />}
        {isStaff && (
          <StatCard
            label="Pending approvals"
            value={pendingCount === null ? '—' : String(pendingCount)}
            hint={pendingCount ? 'Needs your review' : undefined}
          />
        )}
        {isStaff && (
          <Link to="/communications/inbox" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              label="New inquiries"
              value={newInquiryCount === null ? '—' : String(newInquiryCount)}
              hint={newInquiryCount ? 'From the website — click to view' : undefined}
            />
          </Link>
        )}
      </div>

      {isStaff && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Income vs. expenses</h2>
          <p className="text-xs text-gray-400">Last 6 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotals} barGap={2} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={{ stroke: CHART_AXIS }}
                  tickLine={false}
                  tick={{ fill: CHART_MUTED_INK, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_MUTED_INK, fontSize: 12 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => formatKes(Number(value))}
                  contentStyle={{ borderRadius: 8, borderColor: CHART_GRID, fontSize: 12 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#52514e' }}
                  formatter={(value) => (value === 'income' ? 'Income' : 'Expense')}
                />
                <Bar dataKey="income" fill={CHART_INCOME} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill={CHART_EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming activities</h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No upcoming events yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex items-start justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{event.title}</p>
                    {event.location && <p className="text-gray-400">{event.location}</p>}
                  </div>
                  <p className="whitespace-nowrap text-gray-500">{format(new Date(event.starts_at), 'MMM d, HH:mm')}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Open elections</h2>
          {elections.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No elections are open right now.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {elections.map((election) => (
                <li key={election.id} className="flex items-center justify-between text-sm">
                  <p className="font-medium text-gray-800">{election.title}</p>
                  <p className="text-gray-500">Closes {format(new Date(election.closes_at), 'MMM d')}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Latest announcements</h2>
        {announcements.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {announcements.map((a) => (
              <li key={a.id}>
                <p className="text-sm font-medium text-gray-800">{a.title}</p>
                <p className="text-sm text-gray-500">{a.body}</p>
                <p className="mt-1 text-xs text-gray-400">{format(new Date(a.created_at), 'MMM d, yyyy')}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
