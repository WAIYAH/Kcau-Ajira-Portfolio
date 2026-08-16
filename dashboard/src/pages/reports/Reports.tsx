import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { toCsv, downloadCsv } from '../../lib/csv'
import type { Election, ReportRecord, ReportType } from '../../types'

export default function Reports() {
  const [history, setHistory] = useState<ReportRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<ReportType | null>(null)

  const [financeStart, setFinanceStart] = useState('')
  const [financeEnd, setFinanceEnd] = useState('')

  const [closedElections, setClosedElections] = useState<Election[]>([])
  const [selectedElectionId, setSelectedElectionId] = useState('')

  async function loadHistory() {
    setLoadingHistory(true)
    const { data, error } = await supabase
      .from('reports_generated')
      .select('*, generator:profiles!generated_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)
    setLoadingHistory(false)
    if (error) setError(error.message)
    else setHistory((data as unknown as ReportRecord[]) ?? [])
  }

  useEffect(() => {
    loadHistory()
    supabase
      .from('elections')
      .select('*')
      .eq('status', 'closed')
      .order('closes_at', { ascending: false })
      .then(({ data }) => setClosedElections((data as Election[]) ?? []))
  }, [])

  async function saveReport(type: ReportType, csv: string, periodStart: string | null, periodEnd: string | null) {
    const filename = `${type}-${Date.now()}.csv`
    const { data: userData } = await supabase.auth.getUser()

    const { error: uploadError } = await supabase.storage.from('reports').upload(filename, new Blob([csv], { type: 'text/csv' }))
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('reports_generated').insert({
      type,
      generated_by: userData.user?.id ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      file_url: filename,
    })
    if (insertError) throw insertError

    downloadCsv(filename, csv)
    await loadHistory()
  }

  async function generateMembership() {
    setBusy('membership')
    setError(null)
    try {
      const { data, error } = await supabase.from('profiles').select('*')
      if (error) throw error
      const csv = toCsv(data ?? [], ['full_name', 'email', 'phone', 'course', 'year_of_study', 'role', 'status', 'joined_at'])
      await saveReport('membership', csv, null, null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setBusy(null)
    }
  }

  async function generateFinance() {
    setBusy('finance')
    setError(null)
    try {
      let query = supabase.from('transactions').select('occurred_at, type, category, amount, description').order('occurred_at')
      if (financeStart) query = query.gte('occurred_at', financeStart)
      if (financeEnd) query = query.lte('occurred_at', financeEnd)
      const { data, error } = await query
      if (error) throw error

      const rows = data ?? []
      const totalIncome = rows.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
      const totalExpense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
      const withTotal = [
        ...rows,
        { occurred_at: '', type: 'TOTAL', category: '', amount: totalIncome - totalExpense, description: 'Net balance for period' },
      ]

      const csv = toCsv(withTotal, ['occurred_at', 'type', 'category', 'amount', 'description'])
      await saveReport('finance', csv, financeStart || null, financeEnd || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setBusy(null)
    }
  }

  async function generateAttendance() {
    setBusy('attendance')
    setError(null)
    try {
      const [eventsRes, rsvpsRes] = await Promise.all([
        supabase.from('events').select('id, title, starts_at').order('starts_at'),
        supabase.from('event_rsvps').select('event_id, status'),
      ])
      if (eventsRes.error) throw eventsRes.error

      const rows = (eventsRes.data ?? []).map((event) => {
        const eventRsvps = (rsvpsRes.data ?? []).filter((r) => r.event_id === event.id)
        return {
          title: event.title,
          starts_at: event.starts_at,
          going: eventRsvps.filter((r) => r.status === 'going').length,
          maybe: eventRsvps.filter((r) => r.status === 'maybe').length,
          declined: eventRsvps.filter((r) => r.status === 'declined').length,
        }
      })

      const csv = toCsv(rows, ['title', 'starts_at', 'going', 'maybe', 'declined'])
      await saveReport('attendance', csv, null, null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setBusy(null)
    }
  }

  async function generateElection() {
    if (!selectedElectionId) {
      setError('Choose a closed election first.')
      return
    }
    setBusy('election')
    setError(null)
    try {
      const [resultsRes, candidatesRes] = await Promise.all([
        supabase.rpc('get_election_results', { p_election_id: selectedElectionId }),
        supabase.from('candidates').select('id, display_name, position_title').eq('election_id', selectedElectionId),
      ])
      if (resultsRes.error) throw resultsRes.error

      const candidateMap = new Map((candidatesRes.data ?? []).map((c) => [c.id, c.display_name]))
      const rows = (resultsRes.data ?? []).map((r: { position_title: string; candidate_id: string; vote_count: number }) => ({
        position_title: r.position_title,
        candidate: candidateMap.get(r.candidate_id) ?? 'Unknown',
        vote_count: r.vote_count,
      }))

      const csv = toCsv(rows, ['position_title', 'candidate', 'vote_count'])
      await saveReport('election', csv, null, null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setBusy(null)
    }
  }

  async function downloadHistoryItem(item: ReportRecord) {
    if (!item.file_url) return
    const { data, error } = await supabase.storage.from('reports').createSignedUrl(item.file_url, 60)
    if (error) {
      setError(error.message)
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Generate a CSV export, download it, and keep a history for later.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Membership roster</h3>
          <p className="mt-1 text-sm text-gray-500">Every member's profile, role, and status.</p>
          <button
            onClick={generateMembership}
            disabled={busy === 'membership'}
            className="mt-4 rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {busy === 'membership' ? 'Generating…' : 'Generate & download'}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Finance statement</h3>
          <p className="mt-1 text-sm text-gray-500">All transactions, optionally filtered by date range.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={financeStart}
              onChange={(e) => setFinanceStart(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
            <input
              type="date"
              value={financeEnd}
              onChange={(e) => setFinanceEnd(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>
          <button
            onClick={generateFinance}
            disabled={busy === 'finance'}
            className="mt-3 rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {busy === 'finance' ? 'Generating…' : 'Generate & download'}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Event attendance</h3>
          <p className="mt-1 text-sm text-gray-500">RSVP breakdown for every event.</p>
          <button
            onClick={generateAttendance}
            disabled={busy === 'attendance'}
            className="mt-4 rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {busy === 'attendance' ? 'Generating…' : 'Generate & download'}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Election results</h3>
          <p className="mt-1 text-sm text-gray-500">Final vote counts for a closed election.</p>
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          >
            <option value="">Select a closed election…</option>
            {closedElections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <button
            onClick={generateElection}
            disabled={busy === 'election'}
            className="mt-3 rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {busy === 'election' ? 'Generating…' : 'Generate & download'}
          </button>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Report history</h2>
        {loadingHistory ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">No reports generated yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Generated by</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 capitalize text-gray-800">{item.type}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.period_start && item.period_end ? `${item.period_start} – ${item.period_end}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.generator?.full_name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => downloadHistoryItem(item)} className="text-xs font-medium text-kca-blue hover:underline">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
