import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import type { AuditLogEntry } from '../../types'

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*, actor:profiles!actor_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        setLoading(false)
        if (error) setError(error.message)
        else setEntries((data as unknown as AuditLogEntry[]) ?? [])
      })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          A record of sensitive actions: role/status changes, deleted transactions, election status changes. Admin-only.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No audited actions recorded yet.
                </td>
              </tr>
            )}

            {!loading &&
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{entry.actor?.full_name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-800">{entry.action}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.target_table ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-400">
                    {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
