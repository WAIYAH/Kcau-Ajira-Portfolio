import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { AuditLogEntry } from '@/types'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'

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
        <h1 className="font-display text-2xl font-bold text-fg">Audit Log</h1>
        <p className="mt-1 text-sm text-fg-muted">
          A record of sensitive actions: role/status changes, deleted transactions, election status changes. Admin-only.
        </p>
      </div>

      {error && <p className="text-sm text-danger-ink">{error}</p>}

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fg-subtle">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState icon={ShieldCheck} title="No audited actions recorded yet" className="border-none" />
                </td>
              </tr>
            )}

            {!loading &&
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-fg">{entry.actor?.full_name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-fg">{entry.action}</td>
                  <td className="px-4 py-3 text-fg-muted">{entry.target_table ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-fg-subtle">
                    {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
