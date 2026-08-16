import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface NotificationSignal {
  label: string
  to: string
  count: number
}

/**
 * The bell surfaces existing derivable signals rather than a real
 * notifications table (see improve.md §11 non-goals): pending approvals +
 * new inquiries for staff, open elections for everyone.
 */
export function useNotificationSignals() {
  const { isStaff } = useAuth()
  const [items, setItems] = useState<NotificationSignal[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      const signals: NotificationSignal[] = []

      if (isStaff) {
        const [pendingRes, inquiriesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ])
        const pending = pendingRes.count ?? 0
        const inquiries = inquiriesRes.count ?? 0
        if (pending > 0) signals.push({ label: `${pending} pending approval${pending === 1 ? '' : 's'}`, to: '/members', count: pending })
        if (inquiries > 0)
          signals.push({
            label: `${inquiries} new inquir${inquiries === 1 ? 'y' : 'ies'}`,
            to: '/communications/inbox',
            count: inquiries,
          })
      }

      const electionsRes = await supabase.from('elections').select('id', { count: 'exact', head: true }).eq('status', 'open')
      const openElections = electionsRes.count ?? 0
      if (openElections > 0) {
        signals.push({ label: `${openElections} open election${openElections === 1 ? '' : 's'}`, to: '/voting', count: openElections })
      }

      if (active) setItems(signals)
    }

    load()
    return () => {
      active = false
    }
  }, [isStaff])

  const count = items.reduce((sum, item) => sum + item.count, 0)

  return { count, items }
}
