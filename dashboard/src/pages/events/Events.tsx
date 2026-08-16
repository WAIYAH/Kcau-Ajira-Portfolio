import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import type { EventItem, EventRsvp, RsvpStatus } from '../../types'

const emptyForm = {
  title: '',
  description: '',
  category: '',
  location: '',
  startsAt: '',
  endsAt: '',
  coverImageUrl: '',
}

const rsvpOptions: { value: RsvpStatus; label: string }[] = [
  { value: 'going', label: "I'm going" },
  { value: 'maybe', label: 'Maybe' },
  { value: 'declined', label: "Can't go" },
]

export default function Events() {
  const { profile, isStaff } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [rsvps, setRsvps] = useState<EventRsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    const [eventsRes, rsvpsRes] = await Promise.all([
      supabase.from('events').select('*').order('starts_at', { ascending: true }),
      supabase.from('event_rsvps').select('*'),
    ])
    setLoading(false)
    if (eventsRes.error) setError(eventsRes.error.message)
    else setEvents((eventsRes.data as EventItem[]) ?? [])
    if (rsvpsRes.data) setRsvps(rsvpsRes.data as EventRsvp[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const upcoming: EventItem[] = []
    const past: EventItem[] = []
    for (const e of events) {
      if (new Date(e.starts_at).getTime() >= now) upcoming.push(e)
      else past.push(e)
    }
    return { upcoming, past: past.reverse() }
  }, [events])

  function countsFor(eventId: string) {
    const eventRsvps = rsvps.filter((r) => r.event_id === eventId)
    return {
      going: eventRsvps.filter((r) => r.status === 'going').length,
      maybe: eventRsvps.filter((r) => r.status === 'maybe').length,
      declined: eventRsvps.filter((r) => r.status === 'declined').length,
    }
  }

  function myRsvp(eventId: string) {
    return rsvps.find((r) => r.event_id === eventId && r.profile_id === profile?.id)
  }

  function startEdit(event: EventItem) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description ?? '',
      category: event.category ?? '',
      location: event.location ?? '',
      startsAt: event.starts_at.slice(0, 16),
      endsAt: event.ends_at ? event.ends_at.slice(0, 16) : '',
      coverImageUrl: event.cover_image_url ?? '',
    })
    setShowForm(true)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      location: form.location || null,
      starts_at: new Date(form.startsAt).toISOString(),
      ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      cover_image_url: form.coverImageUrl || null,
    }

    const result = editingId
      ? await supabase.from('events').update(payload).eq('id', editingId)
      : await supabase.from('events').insert(payload)

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadData()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event? RSVPs will be removed too.')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) setError(error.message)
    else await loadData()
  }

  async function setRsvp(eventId: string, status: RsvpStatus) {
    if (!profile) return
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert({ event_id: eventId, profile_id: profile.id, status }, { onConflict: 'event_id,profile_id' })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setRsvps((prev) => {
      const withoutMine = prev.filter((r) => !(r.event_id === eventId && r.profile_id === profile.id))
      return [...withoutMine, data as EventRsvp]
    })
  }

  function EventCard({ event }: { event: EventItem }) {
    const counts = countsFor(event.id)
    const mine = myRsvp(event.id)

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt="" className="h-40 w-full object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(event.starts_at), 'EEE, MMM d, yyyy · HH:mm')}
                {event.location && ` · ${event.location}`}
              </p>
            </div>
            {event.category && (
              <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-kca-blue">
                {event.category}
              </span>
            )}
          </div>

          {event.description && <p className="mt-3 text-sm text-gray-600">{event.description}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {rsvpOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRsvp(event.id, opt.value)}
                aria-pressed={mine?.status === opt.value}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mine?.status === opt.value
                    ? 'border-kca-blue bg-kca-blue text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isStaff && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                {counts.going} going · {counts.maybe} maybe · {counts.declined} declined
              </p>
              <div className="flex gap-3">
                <button onClick={() => startEdit(event)} className="text-xs font-medium text-kca-blue hover:underline">
                  Edit
                </button>
                <button onClick={() => deleteEvent(event.id)} className="text-xs font-medium text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">RSVP to what's coming up, or browse what's already happened.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              if (showForm) resetForm()
              setShowForm((v) => !v)
            }}
            className="rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark"
          >
            {showForm ? 'Cancel' : '+ New event'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="event-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="event-starts" className="block text-sm font-medium text-gray-700">Starts at</label>
            <input
              id="event-starts"
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="event-ends" className="block text-sm font-medium text-gray-700">Ends at (optional)</label>
            <input
              id="event-ends"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="event-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="event-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Skill Lab, Meeting, Social"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">Location</label>
            <input
              id="event-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="event-cover" className="block text-sm font-medium text-gray-700">Cover image URL (optional)</label>
            <input
              id="event-cover"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="event-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading events…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming events.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Past</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
