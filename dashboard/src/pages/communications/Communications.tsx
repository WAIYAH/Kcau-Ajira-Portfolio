import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
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
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="mt-1 text-sm text-gray-500">Incoming inquiries from the website, and outgoing announcements.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <NavLink
          to="/communications/inbox"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm font-medium ${
              isActive ? 'border-b-2 border-kca-blue text-kca-blue' : 'text-gray-500 hover:text-gray-700'
            }`
          }
        >
          Inbox
          {newCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{newCount}</span>
          )}
        </NavLink>
        <NavLink
          to="/communications/announcements"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium ${
              isActive ? 'border-b-2 border-kca-blue text-kca-blue' : 'text-gray-500 hover:text-gray-700'
            }`
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
