import { useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import Card from '@/components/ui/Card'
import { formatKes } from '@/lib/format'
import type { MonthlyTotal } from '@/hooks/useOverviewData'

interface IncomeExpenseChartProps {
  data: (MonthlyTotal & { net: number })[]
}

type SeriesKey = 'income' | 'expense' | 'net'

const seriesLabel: Record<SeriesKey, string> = {
  income: 'Income',
  expense: 'Expense',
  net: 'Net',
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-control border border-border bg-surface-raised px-3 py-2 text-xs shadow-elevate-lg">
      <p className="mb-1.5 font-medium text-fg">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className="text-fg-muted">{seriesLabel[entry.dataKey as SeriesKey]}</span>
            <span className="ml-auto font-medium tabular-nums text-fg">{formatKes(Number(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set())

  function toggleSeries(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const summary = data.map((d) => `${d.month}: income ${formatKes(d.income)}, expense ${formatKes(d.expense)}`).join('. ')

  return (
    <Card padding="md">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-fg">Income vs. expenses</h2>
          <p className="text-xs text-fg-subtle">Last 6 months</p>
        </div>
      </div>

      <p className="sr-only">Income and expenses over the last 6 months. {summary}.</p>

      <div className="mt-4 h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: 'var(--color-border-strong)' }}
              tickLine={false}
              tick={{ fill: 'var(--color-fg-subtle)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-fg-subtle)', fontSize: 12 }}
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              width={40}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: 'var(--color-border-strong)', strokeDasharray: 4 }}
            />
            <Legend
              onClick={(e) => toggleSeries(e.dataKey as SeriesKey)}
              formatter={(value) => <span className="cursor-pointer text-xs text-fg-muted">{seriesLabel[value as SeriesKey]}</span>}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Area
              dataKey="income"
              hide={hidden.has('income')}
              type="monotone"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#incomeFill)"
              isAnimationActive
              animationDuration={800}
            />
            <Area
              dataKey="expense"
              hide={hidden.has('expense')}
              type="monotone"
              stroke="var(--color-secondary)"
              strokeWidth={2}
              fill="url(#expenseFill)"
              isAnimationActive
              animationDuration={800}
            />
            <Line
              dataKey="net"
              hide={hidden.has('net')}
              type="monotone"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
