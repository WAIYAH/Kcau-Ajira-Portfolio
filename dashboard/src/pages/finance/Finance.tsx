import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import Ledger from './Ledger'
import Dues from './Dues'
import Budgets from './Budgets'

const tabs = [
  { to: '/finance/ledger', label: 'Ledger' },
  { to: '/finance/dues', label: 'Dues' },
  { to: '/finance/budgets', label: 'Budgets' },
]

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="ledger" replace />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="dues" element={<Dues />} />
        <Route path="budgets" element={<Budgets />} />
      </Routes>
    </div>
  )
}
