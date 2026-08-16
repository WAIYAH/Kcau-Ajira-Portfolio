import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Inbox as InboxIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Inquiry, InquiryStatus, InquiryType } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const statusStyles: Record<InquiryStatus, string> = {
  new: 'bg-secondary/15 text-secondary',
  in_progress: 'bg-primary/15 text-primary',
  resolved: 'bg-success/15 text-success',
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
        <h1 className="font-display text-2xl font-bold text-fg">Inbox</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Real submissions from the public website's Contact and Join forms.
          {newCount > 0 && <span className="ml-1 font-medium text-secondary">{newCount} new.</span>}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="w-auto">
          <option value="all">All types</option>
          <option value="contact">Contact form</option>
          <option value="join_interest">Join interest</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-auto capitalize">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </Select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-fg-subtle">Loading inquiries…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={InboxIcon} title="No inquiries match your filters" />
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <Card key={inquiry.id} padding="md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-fg">{inquiry.name}</p>
                  <p className="text-sm text-fg-muted">
                    {inquiry.email}
                    {inquiry.phone && ` · ${inquiry.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded-full bg-fg/10 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                    {typeLabels[inquiry.type]}
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                      statusStyles[inquiry.status],
                    )}
                  >
                    {inquiry.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {inquiry.subject && <p className="mt-3 text-sm font-medium text-fg">{inquiry.subject}</p>}
              {inquiry.message && <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">{inquiry.message}</p>}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-fg-subtle">{format(new Date(inquiry.created_at), 'MMM d, yyyy HH:mm')}</p>
                <div className="flex gap-2">
                  {inquiry.status !== 'in_progress' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(inquiry.id, 'in_progress')}
                      loading={busyId === inquiry.id}
                      className="border border-border"
                    >
                      Mark in progress
                    </Button>
                  )}
                  {inquiry.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(inquiry.id, 'resolved')}
                      loading={busyId === inquiry.id}
                      className="bg-success text-white hover:bg-success"
                    >
                      Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
