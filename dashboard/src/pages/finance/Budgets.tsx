import { useEffect, useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatKes } from '@/lib/format'
import type { Budget } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

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
          <h1 className="font-display text-2xl font-bold text-fg">Budgets</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Planned spend per category vs. actual expenses recorded in the ledger (all-time actuals).
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add budget line'}</Button>
      </div>

      {showForm && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="budget-term" className="block text-sm font-medium text-fg">
                Term
              </label>
              <Input
                id="budget-term"
                type="text"
                required
                placeholder="e.g. 2026 Trimester 1"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="budget-category" className="block text-sm font-medium text-fg">
                Category
              </label>
              <Input
                id="budget-category"
                type="text"
                required
                placeholder="Must match ledger category to compare"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="budget-planned" className="block text-sm font-medium text-fg">
                Planned amount (KES)
              </label>
              <Input
                id="budget-planned"
                type="number"
                min="0"
                step="0.01"
                required
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && <p className="text-sm text-danger sm:col-span-3">{error}</p>}

            <div className="sm:col-span-3">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : 'Save budget line'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && error && <p className="text-sm text-danger">{error}</p>}

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Term</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Planned</th>
              <th className="px-4 py-3 text-right font-medium">Actual</th>
              <th className="px-4 py-3 text-right font-medium">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fg-subtle">
                  Loading budgets…
                </td>
              </tr>
            )}

            {!loading && budgets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState icon={Wallet} title="No budget lines yet" className="border-none" />
                </td>
              </tr>
            )}

            {!loading &&
              budgets.map((b) => {
                const actual = actualsByCategory[b.category] ?? 0
                const variance = Number(b.planned_amount) - actual
                return (
                  <tr key={b.id} className="transition-colors hover:bg-fg/5">
                    <td className="px-4 py-3 text-fg-muted">{b.term}</td>
                    <td className="px-4 py-3 text-fg">{b.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-fg">{formatKes(Number(b.planned_amount))}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-fg">{formatKes(actual)}</td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-right font-medium',
                        variance < 0 ? 'text-danger' : 'text-success',
                      )}
                    >
                      {variance < 0 ? '-' : '+'}
                      {formatKes(Math.abs(variance))}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
