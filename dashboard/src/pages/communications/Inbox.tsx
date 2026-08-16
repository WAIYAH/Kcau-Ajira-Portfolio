import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import type { Inquiry, InquiryStatus, InquiryType } from '../../types'

const statusStyles: Record<InquiryStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
}

const typeLabels: Record<InquiryType, string> = {
  contact: 'Contact form',
  join_interest: 'Join interest',
}

type StatusFilter = 'all' | InquiryStatus
type TypeFilter = 'all' | InquiryType

export default function Inbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadInquiries() {
    setLoading(true)
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) setError(error.message)
    else setInquiries((data as Inquiry[]) ?? [])
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  const filtered = useMemo(() => {
    return inquiries.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (typeFilter !== 'all' && i.type !== typeFilter) return false
      return true
    })
  }, [inquiries, statusFilter, typeFilter])

  const newCount = inquiries.filter((i) => i.status === 'new').length

  async function updateStatus(id: string, status: InquiryStatus) {
    setBusyId(id)
    const { data, error } = await supabase.from('inquiries').update({ status }).eq('id', id).select().single()
    setBusyId(null)
    if (error) {
      setError(error.message)
      return
    }
    setInquiries((prev) => prev.map((i) => (i.id === id ? (data as Inquiry) : i)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real submissions from the public website's Contact and Join forms.
          {newCount > 0 && <span className="ml-1 font-medium text-amber-600">{newCount} new.</span>}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
        >
          <option value="all">All types</option>
          <option value="contact">Contact form</option>
          <option value="join_interest">Join interest</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading inquiries…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No inquiries match your filters.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <div key={inquiry.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{inquiry.name}</p>
                  <p className="text-sm text-gray-500">
                    {inquiry.email}
                    {inquiry.phone && ` · ${inquiry.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {typeLabels[inquiry.type]}
                  </span>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[inquiry.status]}`}>
                    {inquiry.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {inquiry.subject && <p className="mt-3 text-sm font-medium text-gray-700">{inquiry.subject}</p>}
              {inquiry.message && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{inquiry.message}</p>}

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">{format(new Date(inquiry.created_at), 'MMM d, yyyy HH:mm')}</p>
                <div className="flex gap-2">
                  {inquiry.status !== 'in_progress' && (
                    <button
                      onClick={() => updateStatus(inquiry.id, 'in_progress')}
                      disabled={busyId === inquiry.id}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-60"
                    >
                      Mark in progress
                    </button>
                  )}
                  {inquiry.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(inquiry.id, 'resolved')}
                      disabled={busyId === inquiry.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
