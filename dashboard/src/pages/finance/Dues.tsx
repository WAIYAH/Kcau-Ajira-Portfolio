import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { formatKes } from '../../lib/format'
import type { MembershipDue, Profile } from '../../types'
import StatCard from '../../components/StatCard'

function statusFor(amountDue: number, amountPaid: number): MembershipDue['status'] {
  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid >= amountDue) return 'paid'
  return 'partial'
}

const statusStyles: Record<MembershipDue['status'], string> = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
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
      supabase
        .from('membership_dues')
        .select('*, profiles(full_name, email)')
        .order('due_date', { ascending: true }),
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
          <h1 className="text-2xl font-bold text-gray-900">Membership Dues</h1>
          <p className="mt-1 text-sm text-gray-500">Track who's paid, who owes, and by when.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark"
        >
          {showForm ? 'Cancel' : '+ Add dues record'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total due" value={formatKes(totalDue)} />
        <StatCard label="Total collected" value={formatKes(totalPaid)} />
        <StatCard label="Outstanding" value={formatKes(outstanding)} />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="due-member" className="block text-sm font-medium text-gray-700">Member</label>
            <select
              id="due-member"
              required
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="due-term" className="block text-sm font-medium text-gray-700">Term</label>
            <input
              id="due-term"
              type="text"
              required
              placeholder="e.g. 2026 Trimester 1"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="due-amount" className="block text-sm font-medium text-gray-700">Amount due (KES)</label>
            <input
              id="due-amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={amountDue}
              onChange={(e) => setAmountDue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Due date (optional)</label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save dues record'}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Term</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium text-right">Due</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading dues…
                </td>
              </tr>
            )}

            {!loading && dues.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No dues records yet.
                </td>
              </tr>
            )}

            {!loading &&
              dues.map((due) => (
                <tr key={due.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{due.profiles?.full_name ?? 'Unknown member'}</p>
                    <p className="text-xs text-gray-400">{due.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{due.term}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {due.due_date ? format(new Date(due.due_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-800">{formatKes(Number(due.amount_due))}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-800">{formatKes(Number(due.amount_paid))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[due.status]}`}>
                      {due.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {due.status !== 'paid' &&
                      (paymentEditId === due.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            autoFocus
                            aria-label={`Payment amount for ${due.profiles?.full_name ?? 'member'}`}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
                          />
                          <button
                            onClick={() => recordPayment(due)}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setPaymentEditId(null)
                              setPaymentAmount('')
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPaymentEditId(due.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Record payment
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
