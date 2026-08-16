import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface SearchResult {
  id: string
  label: string
  sublabel: string
  to: string
}

/**
 * Scoped to events + announcements for now (both readable by every signed-in
 * role, so no RLS edge cases). Extending this to member search (staff-only,
 * RLS-gated) is real Phase 3 work once the data-layer conventions for
 * role-conditional queries are settled — see improve.md §11.
 */
export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const timeout = window.setTimeout(async () => {
      const [eventsRes, announcementsRes] = await Promise.all([
        supabase.from('events').select('id, title').ilike('title', `%${trimmed}%`).limit(5),
        supabase.from('announcements').select('id, title').ilike('title', `%${trimmed}%`).limit(5),
      ])
      if (!active) return

      const next: SearchResult[] = [
        ...(eventsRes.data ?? []).map((row) => ({
          id: `event-${row.id}`,
          label: row.title,
          sublabel: 'Event',
          to: '/events',
        })),
        ...(announcementsRes.data ?? []).map((row) => ({
          id: `ann-${row.id}`,
          label: row.title,
          sublabel: 'Announcement',
          to: '/communications/announcements',
        })),
      ]
      setResults(next)
      setLoading(false)
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [query])

  return { results, loading }
}
