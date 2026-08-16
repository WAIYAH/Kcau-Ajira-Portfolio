import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/cn'
import Inbox from './Inbox'
import Announcements from './Announcements'

export default function Communications() {
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count }) => setNewCount(count ?? 0))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Communications</h1>
        <p className="mt-1 text-sm text-fg-muted">Incoming inquiries from the website, and outgoing announcements.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <NavLink
          to="/communications/inbox"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg',
            )
          }
        >
          Inbox
          {newCount > 0 && (
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary-ink">{newCount}</span>
          )}
        </NavLink>
        <NavLink
          to="/communications/announcements"
          className={({ isActive }) =>
            cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg',
            )
          }
        >
          Announcements
        </NavLink>
      </div>

      <Routes>
        <Route index element={<Navigate to="inbox" replace />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="announcements" element={<Announcements />} />
      </Routes>
    </div>
  )
}
