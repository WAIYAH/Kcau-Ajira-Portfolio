import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { Megaphone, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Announcement, AnnouncementAudience, EmailLogEntry } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

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
      supabase.from('email_log').select('*, sender:profiles!sent_by(full_name)').order('created_at', { ascending: false }).limit(10),
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
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="announcement-title" className="block text-sm font-medium text-fg">
              Title
            </label>
            <Input id="announcement-title" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="announcement-body" className="block text-sm font-medium text-fg">
              Message
            </label>
            <Textarea
              id="announcement-body"
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 min-h-0"
            />
          </div>

          <div>
            <label htmlFor="announcement-audience" className="block text-sm font-medium text-fg">
              Audience
            </label>
            <Select
              id="announcement-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="mt-1"
            >
              {audienceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex items-end gap-2 pb-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={alsoEmail}
              onChange={(e) => setAlsoEmail(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Also send by email
          </label>

          {error && <p className="text-sm text-danger-ink sm:col-span-2">{error}</p>}
          {notice && <p className="text-sm text-fg-muted sm:col-span-2">{notice}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Posting…' : 'Post announcement'}
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-subtle">Announcements feed</h2>
        {loading ? (
          <p className="text-sm text-fg-subtle">Loading…</p>
        ) : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" />
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id} padding="md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-fg">{a.title}</p>
                  <span className="whitespace-nowrap rounded-full bg-fg/10 px-2.5 py-0.5 text-xs font-medium capitalize text-fg-muted">
                    {a.audience}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">{a.body}</p>
                <p className="mt-2 text-xs text-fg-subtle">
                  {a.sender?.full_name ?? 'Unknown'} · {format(new Date(a.created_at), 'MMM d, yyyy HH:mm')} ·{' '}
                  {a.sent_via === 'both' ? 'In-app + email' : 'In-app only'}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-subtle">Recent email sends</h2>
        {emailLog.length === 0 ? (
          <EmptyState icon={Mail} title="No emails sent yet" />
        ) : (
          <Card padding="none" className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-fg-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emailLog.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-fg">{entry.subject}</td>
                    <td className="px-4 py-3 capitalize text-fg-muted">{entry.audience}</td>
                    <td className="px-4 py-3 text-fg-muted">{entry.recipient_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                          entry.status === 'sent' ? 'bg-success/15 text-success-ink' : 'bg-danger/15 text-danger-ink',
                        )}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                      {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  )
}
