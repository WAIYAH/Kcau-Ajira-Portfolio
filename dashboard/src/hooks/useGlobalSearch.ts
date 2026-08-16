import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface SearchResult {
  id: string
  label: string
  sublabel: string
  to: string
}

/**
 * Events + announcements are readable by every signed-in role, so they're
 * always searched. Member search additionally queries `profiles` — gated on
 * `includeMembers` (pass `isStaff`), since `profiles` RLS only grants
 * broad-read to staff; members can only read their own row, so a plain
 * member's query would just come back empty rather than error, but there's
 * no reason to even send it.
 */
export function useGlobalSearch(query: string, includeMembers: boolean) {
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
      const [eventsRes, announcementsRes, membersRes] = await Promise.all([
        supabase.from('events').select('id, title').ilike('title', `%${trimmed}%`).limit(5),
        supabase.from('announcements').select('id, title').ilike('title', `%${trimmed}%`).limit(5),
        includeMembers
          ? supabase
              .from('profiles')
              .select('id, full_name, email')
              .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
              .limit(5)
          : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
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
        ...(membersRes.data ?? []).map((row) => ({
          id: `member-${row.id}`,
          label: row.full_name,
          sublabel: 'Member',
          to: `/members?q=${encodeURIComponent(row.full_name)}`,
        })),
      ]
      setResults(next)
      setLoading(false)
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [query, includeMembers])

  return { results, loading }
}
