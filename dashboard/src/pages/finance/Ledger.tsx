import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { formatKes } from '../../lib/format'
import { logAudit } from '../../lib/audit'
import type { Transaction, TransactionType } from '../../types'
import StatCard from '../../components/StatCard'

export default function Ledger() {
  const { isAdmin } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [type, setType] = useState<TransactionType>('income')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  async function loadTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, recorder:profiles!recorded_by(full_name)')
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) setError(error.message)
    else setTransactions((data as unknown as Transaction[]) ?? [])
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  function resetForm() {
    setType('income')
    setCategory('')
    setAmount('')
    setDescription('')
    setOccurredAt(format(new Date(), 'yyyy-MM-dd'))
    setReceiptFile(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    let receiptPath: string | null = null

    if (receiptFile) {
      const path = `${crypto.randomUUID()}-${receiptFile.name}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, receiptFile)
      if (uploadError) {
        setSaving(false)
        setError(`Receipt upload failed: ${uploadError.message}`)
        return
      }
      receiptPath = path
    }

    const { data: userData } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from('transactions').insert({
      type,
      category,
      amount: Number(amount),
      description: description || null,
      occurred_at: occurredAt,
      receipt_url: receiptPath,
      recorded_by: userData.user?.id ?? null,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadTransactions()
  }

  async function viewReceipt(path: string) {
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60)
    if (error) {
      setError(error.message)
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    const target = transactions.find((t) => t.id === id)
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      logAudit('delete_transaction', 'transactions', id, target ? { type: target.type, amount: target.amount, category: target.category } : undefined)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Ledger</h1>
          <p className="mt-1 text-sm text-gray-500">Every income and expense, in one running record.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark"
        >
          {showForm ? 'Cancel' : '+ Add transaction'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Balance" value={formatKes(balance)} />
        <StatCard label="Total income" value={formatKes(totalIncome)} />
        <StatCard label="Total expenses" value={formatKes(totalExpense)} />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <label htmlFor="txn-type" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="txn-type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label htmlFor="txn-amount" className="block text-sm font-medium text-gray-700">Amount (KES)</label>
            <input
              id="txn-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="txn-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="txn-category"
              type="text"
              required
              placeholder="e.g. Membership dues, Venue hire, Catering"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="txn-date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              id="txn-date"
              type="date"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="txn-description" className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <input
              id="txn-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="txn-receipt" className="block text-sm font-medium text-gray-700">Receipt (optional)</label>
            <input
              id="txn-receipt"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-gray-600"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save transaction'}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Recorded by</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading transactions…
                </td>
              </tr>
            )}

            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No transactions recorded yet.
                </td>
              </tr>
            )}

            {!loading &&
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{format(new Date(t.occurred_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-gray-800">{t.category}</td>
                  <td className="px-4 py-3 text-gray-500">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.recorder?.full_name ?? '—'}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatKes(Number(t.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {t.receipt_url && (
                        <button onClick={() => viewReceipt(t.receipt_url!)} className="text-xs font-medium text-kca-blue hover:underline">
                          Receipt
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => deleteTransaction(t.id)} className="text-xs font-medium text-red-500 hover:underline">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
