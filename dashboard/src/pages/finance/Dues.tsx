import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { PiggyBank } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatKes } from '@/lib/format'
import type { MembershipDue, Profile } from '@/types'
import StatCard from '@/components/StatCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

function statusFor(amountDue: number, amountPaid: number): MembershipDue['status'] {
  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid >= amountDue) return 'paid'
  return 'partial'
}

const statusStyles: Record<MembershipDue['status'], string> = {
  unpaid: 'bg-danger/15 text-danger-ink',
  partial: 'bg-secondary/15 text-secondary-ink',
  paid: 'bg-success/15 text-success-ink',
}

export default function Dues() {
  const [dues, setDues] = useState<MembershipDue[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profileId, setProfileId] = useState('')
  const [term, setTerm] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [paymentEditId, setPaymentEditId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  async function loadData() {
    setLoading(true)
    const [duesRes, membersRes] = await Promise.all([
      supabase.from('membership_dues').select('*, profiles(full_name, email)').order('due_date', { ascending: true }),
      supabase.from('profiles').select('*').order('full_name'),
    ])
    setLoading(false)
    if (duesRes.error) setError(duesRes.error.message)
    else setDues((duesRes.data as unknown as MembershipDue[]) ?? [])
    if (membersRes.data) setMembers(membersRes.data as Profile[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalDue = dues.reduce((sum, d) => sum + Number(d.amount_due), 0)
  const totalPaid = dues.reduce((sum, d) => sum + Number(d.amount_paid), 0)
  const outstanding = totalDue - totalPaid

  function resetForm() {
    setProfileId('')
    setTerm('')
    setAmountDue('')
    setDueDate('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('membership_dues').insert({
      profile_id: profileId,
      term,
      amount_due: Number(amountDue),
      amount_paid: 0,
      status: 'unpaid',
      due_date: dueDate || null,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadData()
  }

  async function recordPayment(due: MembershipDue) {
    const paid = Number(paymentAmount)
    if (!paid || paid <= 0) return

    const newAmountPaid = Number(due.amount_paid) + paid
    const newStatus = statusFor(Number(due.amount_due), newAmountPaid)

    const { data, error } = await supabase
      .from('membership_dues')
      .update({ amount_paid: newAmountPaid, status: newStatus })
      .eq('id', due.id)
      .select('*, profiles(full_name, email)')
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setDues((prev) => prev.map((d) => (d.id === due.id ? (data as unknown as MembershipDue) : d)))
    setPaymentEditId(null)
    setPaymentAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Membership Dues</h1>
          <p className="mt-1 text-sm text-fg-muted">Track who's paid, who owes, and by when.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add dues record'}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total due" value={formatKes(totalDue)} />
        <StatCard label="Total collected" value={formatKes(totalPaid)} />
        <StatCard label="Outstanding" value={formatKes(outstanding)} />
      </div>

      {showForm && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="due-member" className="block text-sm font-medium text-fg">
                Member
              </label>
              <Select id="due-member" required value={profileId} onChange={(e) => setProfileId(e.target.value)} className="mt-1">
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.email})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="due-term" className="block text-sm font-medium text-fg">
                Term
              </label>
              <Input
                id="due-term"
                type="text"
                required
                placeholder="e.g. 2026 Trimester 1"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="due-amount" className="block text-sm font-medium text-fg">
                Amount due (KES)
              </label>
              <Input
                id="due-amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="due-date" className="block text-sm font-medium text-fg">
                Due date (optional)
              </label>
              <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </div>

            {error && <p className="text-sm text-danger-ink sm:col-span-2">{error}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : 'Save dues record'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && error && <p className="text-sm text-danger-ink">{error}</p>}

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Term</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 text-right font-medium">Due</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fg-subtle">
                  Loading dues…
                </td>
              </tr>
            )}

            {!loading && dues.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10">
                  <EmptyState icon={PiggyBank} title="No dues records yet" className="border-none" />
                </td>
              </tr>
            )}

            {!loading &&
              dues.map((due) => (
                <tr key={due.id} className="transition-colors hover:bg-fg/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{due.profiles?.full_name ?? 'Unknown member'}</p>
                    <p className="text-xs text-fg-subtle">{due.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{due.term}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {due.due_date ? format(new Date(due.due_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-fg">{formatKes(Number(due.amount_due))}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-fg">{formatKes(Number(due.amount_paid))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                        statusStyles[due.status],
                      )}
                    >
                      {due.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {due.status !== 'paid' &&
                      (paymentEditId === due.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            autoFocus
                            aria-label={`Payment amount for ${due.profiles?.full_name ?? 'member'}`}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Amount"
                            className="h-8 w-24 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => recordPayment(due)}
                            className="bg-success-solid text-white hover:bg-success-solid"
                          >
                            Save
                          </Button>
                          <button
                            onClick={() => {
                              setPaymentEditId(null)
                              setPaymentAmount('')
                            }}
                            className="text-xs text-fg-subtle hover:text-fg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setPaymentEditId(due.id)} className="border border-border">
                          Record payment
                        </Button>
                      ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
