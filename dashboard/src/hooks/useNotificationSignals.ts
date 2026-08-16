import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface NotificationSignal {
  label: string
  to: string
  count: number
}

export interface PersistedNotification {
  id: string
  title: string
  link: string
  createdAt: string
}

const MAX_SHOWN = 8

/**
 * Two sources merged into one bell:
 * - Ephemeral signals: pending approvals + new inquiries (staff) and open
 *   elections (everyone) -- derived on load, no history, self-resolving.
 * - Persisted notifications (`notifications` table, see migration 0010):
 *   individual rows fanned out by DB triggers on new announcements/
 *   opportunities/election-openings, with real "mark as read" and a live
 *   Realtime subscription so a badge updates without a manual refresh.
 */
export function useNotificationSignals() {
  const { isStaff, profile } = useAuth()
  const [items, setItems] = useState<NotificationSignal[]>([])
  const [notifications, setNotifications] = useState<PersistedNotification[]>([])

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

  useEffect(() => {
    if (!profile) return
    let active = true

    async function loadNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, link, created_at')
        .eq('profile_id', profile!.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(MAX_SHOWN)
      if (active && data) {
        setNotifications(data.map((n) => ({ id: n.id, title: n.title, link: n.link ?? '/', createdAt: n.created_at })))
      }
    }

    loadNotifications()

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profile.id}` },
        (payload) => {
          const row = payload.new as { id: string; title: string; link: string | null; created_at: string }
          setNotifications((prev) => [{ id: row.id, title: row.title, link: row.link ?? '/', createdAt: row.created_at }, ...prev].slice(0, MAX_SHOWN))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [profile])

  async function markRead(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  }

  const count = items.reduce((sum, item) => sum + item.count, 0) + notifications.length

  return { count, items, notifications, markRead }
}
