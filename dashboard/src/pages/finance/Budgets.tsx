import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { formatKes } from '../../lib/format'
import type { Budget } from '../../types'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [actualsByCategory, setActualsByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [term, setTerm] = useState('')
  const [category, setCategory] = useState('')
  const [plannedAmount, setPlannedAmount] = useState('')

  async function loadData() {
    setLoading(true)
    const [budgetsRes, transactionsRes] = await Promise.all([
      supabase.from('budgets').select('*').order('term', { ascending: false }),
      supabase.from('transactions').select('category, amount').eq('type', 'expense'),
    ])
    setLoading(false)

    if (budgetsRes.error) setError(budgetsRes.error.message)
    else setBudgets((budgetsRes.data as Budget[]) ?? [])

    if (transactionsRes.data) {
      const totals: Record<string, number> = {}
      for (const t of transactionsRes.data as { category: string; amount: number }[]) {
        totals[t.category] = (totals[t.category] ?? 0) + Number(t.amount)
      }
      setActualsByCategory(totals)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setTerm('')
    setCategory('')
    setPlannedAmount('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('budgets').insert({
      term,
      category,
      planned_amount: Number(plannedAmount),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planned spend per category vs. actual expenses recorded in the ledger (all-time actuals).
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark"
        >
          {showForm ? 'Cancel' : '+ Add budget line'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-3">
          <div>
            <label htmlFor="budget-term" className="block text-sm font-medium text-gray-700">Term</label>
            <input
              id="budget-term"
              type="text"
              required
              placeholder="e.g. 2026 Trimester 1"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="budget-category"
              type="text"
              required
              placeholder="Must match ledger category to compare"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="budget-planned" className="block text-sm font-medium text-gray-700">Planned amount (KES)</label>
            <input
              id="budget-planned"
              type="number"
              min="0"
              step="0.01"
              required
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save budget line'}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Term</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Planned</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading budgets…
                </td>
              </tr>
            )}

            {!loading && budgets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No budget lines yet.
                </td>
              </tr>
            )}

            {!loading &&
              budgets.map((b) => {
                const actual = actualsByCategory[b.category] ?? 0
                const variance = Number(b.planned_amount) - actual
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{b.term}</td>
                    <td className="px-4 py-3 text-gray-800">{b.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-800">{formatKes(Number(b.planned_amount))}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-800">{formatKes(actual)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {variance < 0 ? '-' : '+'}
                      {formatKes(Math.abs(variance))}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
