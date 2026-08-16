import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { format, isPast } from 'date-fns'
import { Briefcase, ExternalLink, Mail, MapPin, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Opportunity, OpportunityType } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import TagInput from '@/components/ui/TagInput'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

const typeLabels: Record<OpportunityType, string> = {
  job: 'Job',
  internship: 'Internship',
  gig: 'Gig',
  freelance: 'Freelance',
  scholarship: 'Scholarship',
}

const emptyForm = {
  title: '',
  organization: '',
  type: 'gig' as OpportunityType,
  location: '',
  isRemote: false,
  skillTags: [] as string[],
  description: '',
  applyUrl: '',
  applyEmail: '',
  expiresAt: '',
}

export default function Opportunities() {
  const { profile, isStaff } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState<'all' | OpportunityType>('all')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [search, setSearch] = useState('')

  async function loadOpportunities() {
    setLoading(true)
    const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) setError(error.message)
    else setOpportunities((data as Opportunity[]) ?? [])
  }

  useEffect(() => {
    loadOpportunities()
  }, [])

  const mySkills = useMemo(() => new Set((profile?.skills ?? []).map((s) => s.toLowerCase())), [profile?.skills])

  function isClosed(o: Opportunity) {
    return o.status === 'closed' || (o.expires_at ? isPast(new Date(o.expires_at)) : false)
  }

  function matchesFilters(o: Opportunity) {
    if (typeFilter !== 'all' && o.type !== typeFilter) return false
    if (remoteOnly && !o.is_remote) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      o.title.toLowerCase().includes(q) ||
      o.organization.toLowerCase().includes(q) ||
      o.skill_tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  const { recommended, open, closed } = useMemo(() => {
    const openList: Opportunity[] = []
    const closedList: Opportunity[] = []
    for (const o of opportunities) {
      if (!matchesFilters(o)) continue
      if (isClosed(o)) closedList.push(o)
      else openList.push(o)
    }
    const recommendedList =
      mySkills.size > 0 ? openList.filter((o) => o.skill_tags.some((t) => mySkills.has(t.toLowerCase()))) : []
    const recommendedIds = new Set(recommendedList.map((o) => o.id))
    return { recommended: recommendedList, open: openList.filter((o) => !recommendedIds.has(o.id)), closed: closedList }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunities, typeFilter, remoteOnly, search, mySkills])

  function startEdit(o: Opportunity) {
    setEditingId(o.id)
    setForm({
      title: o.title,
      organization: o.organization,
      type: o.type,
      location: o.location ?? '',
      isRemote: o.is_remote,
      skillTags: o.skill_tags,
      description: o.description,
      applyUrl: o.apply_url ?? '',
      applyEmail: o.apply_email ?? '',
      expiresAt: o.expires_at ? o.expires_at.slice(0, 10) : '',
    })
    setFormError(null)
    setShowForm(true)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.applyUrl && !form.applyEmail) {
      setFormError('Add a way to apply — a URL, an email, or both.')
      return
    }
    setSaving(true)
    setFormError(null)

    const payload = {
      title: form.title,
      organization: form.organization,
      type: form.type,
      location: form.location || null,
      is_remote: form.isRemote,
      skill_tags: form.skillTags,
      description: form.description,
      apply_url: form.applyUrl || null,
      apply_email: form.applyEmail || null,
      expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      ...(editingId ? {} : { posted_by: profile?.id ?? null }),
    }

    const result = editingId
      ? await supabase.from('opportunities').update(payload).eq('id', editingId)
      : await supabase.from('opportunities').insert(payload)

    setSaving(false)

    if (result.error) {
      setFormError(result.error.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadOpportunities()
  }

  async function toggleStatus(o: Opportunity) {
    const { error } = await supabase
      .from('opportunities')
      .update({ status: o.status === 'open' ? 'closed' : 'open' })
      .eq('id', o.id)
    if (error) setError(error.message)
    else await loadOpportunities()
  }

  async function deleteOpportunity(id: string) {
    if (!confirm('Delete this opportunity?')) return
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (error) setError(error.message)
    else await loadOpportunities()
  }

  function OpportunityCard({ o, highlighted = false }: { o: Opportunity; highlighted?: boolean }) {
    const closed = isClosed(o)
    return (
      <Card padding="lg" className={cn(highlighted && !closed && 'border-primary/40 bg-primary/5')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-fg">{o.title}</h3>
            <p className="text-sm text-fg-muted">{o.organization}</p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {typeLabels[o.type]}
          </span>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
          <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
          {o.is_remote ? 'Remote' : o.location || 'Location not specified'}
          {o.is_remote && o.location ? ` · ${o.location}` : ''}
        </p>

        <p className="mt-3 text-sm text-fg-muted">{o.description}</p>

        {o.skill_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {o.skill_tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  mySkills.has(tag.toLowerCase()) ? 'bg-success/15 text-success-ink' : 'bg-fg/5 text-fg-muted',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-fg-subtle">
            {closed ? 'Closed' : o.expires_at ? `Closes ${format(new Date(o.expires_at), 'MMM d, yyyy')}` : 'Open'}
          </p>
          {!closed && (
            <div className="flex gap-2">
              {o.apply_url && (
                <a
                  href={o.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-control bg-primary-solid px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                >
                  Apply <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
                </a>
              )}
              {o.apply_email && (
                <a
                  href={`mailto:${o.apply_email}`}
                  className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-fg/5"
                >
                  <Mail size={12} strokeWidth={2} aria-hidden="true" /> Email
                </a>
              )}
            </div>
          )}
        </div>

        {isStaff && (
          <div className="mt-3 flex gap-3 border-t border-border pt-3">
            <button onClick={() => startEdit(o)} className="text-xs font-medium text-primary hover:underline">
              Edit
            </button>
            <button onClick={() => toggleStatus(o)} className="text-xs font-medium text-fg-muted hover:underline">
              {o.status === 'open' ? 'Close' : 'Reopen'}
            </button>
            <button onClick={() => deleteOpportunity(o.id)} className="text-xs font-medium text-danger-ink hover:underline">
              Delete
            </button>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Opportunities</h1>
          <p className="mt-1 text-sm text-fg-muted">Jobs, internships, gigs, and freelance work for club members.</p>
        </div>
        {isStaff && (
          <Button
            onClick={() => {
              if (showForm) resetForm()
              setShowForm((v) => !v)
            }}
          >
            {showForm ? 'Cancel' : '+ Post opportunity'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="opp-title" className="block text-sm font-medium text-fg">
                Title
              </label>
              <Input id="opp-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>

            <div>
              <label htmlFor="opp-org" className="block text-sm font-medium text-fg">
                Organization
              </label>
              <Input
                id="opp-org"
                required
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="opp-type" className="block text-sm font-medium text-fg">
                Type
              </label>
              <Select id="opp-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityType })} className="mt-1">
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="opp-location" className="block text-sm font-medium text-fg">
                Location
              </label>
              <Input
                id="opp-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Nairobi"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="opp-remote"
                type="checkbox"
                checked={form.isRemote}
                onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="opp-remote" className="text-sm text-fg">
                Remote-friendly
              </label>
            </div>

            <div>
              <label htmlFor="opp-expires" className="block text-sm font-medium text-fg">
                Closes on (optional)
              </label>
              <Input id="opp-expires" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="opp-skills" className="block text-sm font-medium text-fg">
                Skill tags
              </label>
              <TagInput
                id="opp-skills"
                values={form.skillTags}
                onChange={(skillTags) => setForm({ ...form, skillTags })}
                placeholder="e.g. React, Copywriting, Data entry"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="opp-description" className="block text-sm font-medium text-fg">
                Description
              </label>
              <Textarea
                id="opp-description"
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-0"
              />
            </div>

            <div>
              <label htmlFor="opp-apply-url" className="block text-sm font-medium text-fg">
                Apply URL
              </label>
              <Input
                id="opp-apply-url"
                value={form.applyUrl}
                onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="opp-apply-email" className="block text-sm font-medium text-fg">
                Apply email
              </label>
              <Input
                id="opp-apply-email"
                type="email"
                value={form.applyEmail}
                onChange={(e) => setForm({ ...form, applyEmail: e.target.value })}
                className="mt-1"
              />
            </div>

            {formError && <p className="text-sm text-danger-ink sm:col-span-2">{formError}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Post opportunity'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && error && <p className="text-sm text-danger-ink">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Search title, organization, or skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | OpportunityType)} className="sm:w-auto">
          <option value="all">All types</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          Remote only
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <>
          {recommended.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
                Recommended for you
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((o) => (
                  <OpportunityCard key={o.id} o={o} highlighted />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-subtle">Open</h2>
            {open.length === 0 && recommended.length === 0 ? (
              <EmptyState icon={Briefcase} title="No opportunities match your filters" />
            ) : open.length === 0 ? (
              <p className="text-sm text-fg-muted">No other open opportunities right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {open.map((o) => (
                  <OpportunityCard key={o.id} o={o} />
                ))}
              </div>
            )}
          </section>

          {closed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-subtle">Closed</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {closed.map((o) => (
                  <OpportunityCard key={o.id} o={o} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
