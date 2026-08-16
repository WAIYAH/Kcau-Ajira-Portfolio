import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import type { Announcement, AnnouncementAudience, EmailLogEntry } from '../../types'

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'members', label: 'Members only' },
  { value: 'leaders', label: 'Leaders only' },
]

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [alsoEmail, setAlsoEmail] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    const [announcementsRes, emailLogRes] = await Promise.all([
      supabase
        .from('announcements')
        .select('*, sender:profiles!sent_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('email_log')
        .select('*, sender:profiles!sent_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    setLoading(false)
    if (announcementsRes.error) setError(announcementsRes.error.message)
    else setAnnouncements((announcementsRes.data as unknown as Announcement[]) ?? [])
    if (emailLogRes.data) setEmailLog(emailLogRes.data as unknown as EmailLogEntry[])
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setTitle('')
    setBody('')
    setAudience('all')
    setAlsoEmail(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    const { error: postError } = await supabase.from('announcements').insert({
      title,
      body,
      audience,
      sent_via: alsoEmail ? 'both' : 'in-app',
    })

    if (postError) {
      setSaving(false)
      setError(postError.message)
      return
    }

    if (alsoEmail) {
      const { data, error: fnError } = await supabase.functions.invoke('send-announcement-email', {
        body: { subject: title, body, audience },
      })

      if (fnError) {
        setNotice(
          `Posted to the in-app feed, but the email send failed: ${fnError.message}. This usually means the "send-announcement-email" Edge Function isn't deployed yet, or RESEND_API_KEY isn't set — see dashboard/README.md.`,
        )
      } else {
        setNotice(`Posted and emailed to ${data?.recipientCount ?? 0} recipient(s).`)
      }
    } else {
      setNotice('Posted to the in-app announcements feed.')
    }

    setSaving(false)
    resetForm()
    await loadData()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            id="announcement-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="announcement-body" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            id="announcement-body"
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        <div>
          <label htmlFor="announcement-audience" className="block text-sm font-medium text-gray-700">Audience</label>
          <select
            id="announcement-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          >
            {audienceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
          <input type="checkbox" checked={alsoEmail} onChange={(e) => setAlsoEmail(e.target.checked)} />
          Also send by email
        </label>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        {notice && <p className="text-sm text-gray-600 sm:col-span-2">{notice}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {saving ? 'Posting…' : 'Post announcement'}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Announcements feed</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-400">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                    {a.audience}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{a.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {a.sender?.full_name ?? 'Unknown'} · {format(new Date(a.created_at), 'MMM d, yyyy HH:mm')} ·{' '}
                  {a.sent_via === 'both' ? 'In-app + email' : 'In-app only'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recent email sends</h2>
        {emailLog.length === 0 ? (
          <p className="text-sm text-gray-400">No emails sent yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emailLog.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-gray-800">{entry.subject}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{entry.audience}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.recipient_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          entry.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
