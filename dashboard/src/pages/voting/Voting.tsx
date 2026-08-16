import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Vote } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Candidate, Election } from '@/types'
import ElectionCard from '@/components/voting/ElectionCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'

const statusOrder: Record<Election['status'], number> = { open: 0, draft: 1, closed: 2 }

export default function Voting() {
  const { isStaff } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [opensAt, setOpensAt] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)

  async function loadData() {
    setLoading(true)
    const [electionsRes, candidatesRes] = await Promise.all([
      supabase.from('elections').select('*').order('created_at', { ascending: false }),
      supabase.from('candidates').select('*'),
    ])
    setLoading(false)
    if (electionsRes.error) setError(electionsRes.error.message)
    else setElections((electionsRes.data as Election[]) ?? [])
    if (candidatesRes.data) setCandidates(candidatesRes.data as Candidate[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const visibleElections = useMemo(() => {
    const list = isStaff ? elections : elections.filter((e) => e.status !== 'draft')
    return [...list].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }, [elections, isStaff])

  function resetForm() {
    setTitle('')
    setDescription('')
    setOpensAt('')
    setClosesAt('')
    setIsAnonymous(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('elections').insert({
      title,
      description: description || null,
      opens_at: new Date(opensAt).toISOString(),
      closes_at: new Date(closesAt).toISOString(),
      is_anonymous: isAnonymous,
      status: 'draft',
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Voting &amp; Elections</h1>
          <p className="mt-1 text-sm text-fg-muted">Cast your vote in open elections, or view past results.</p>
        </div>
        {isStaff && (
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New election'}</Button>
        )}
      </div>

      {showForm && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="election-title" className="block text-sm font-medium text-fg">
                Title
              </label>
              <Input
                id="election-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2026/27 Executive Committee Elections"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="election-opens" className="block text-sm font-medium text-fg">
                Opens at
              </label>
              <Input
                id="election-opens"
                type="datetime-local"
                required
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="election-closes" className="block text-sm font-medium text-fg">
                Closes at
              </label>
              <Input
                id="election-closes"
                type="datetime-local"
                required
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="election-description" className="block text-sm font-medium text-fg">
                Description
              </label>
              <Textarea
                id="election-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-0"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-fg sm:col-span-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Anonymous ballot (recommended)
            </label>

            <p className="text-xs text-fg-subtle sm:col-span-2">
              New elections start as a draft. Add candidates, then click "Open voting" on the election card when
              you're ready.
            </p>

            {error && <p className="text-sm text-danger-ink sm:col-span-2">{error}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : 'Create election'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && error && <p className="text-sm text-danger-ink">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : visibleElections.length === 0 ? (
        <EmptyState icon={Vote} title="No elections yet" description="Elections you create will show up here." />
      ) : (
        <div className="space-y-4">
          {visibleElections.map((election) => (
            <ElectionCard
              key={election.id}
              election={election}
              candidates={candidates.filter((c) => c.election_id === election.id)}
              onChanged={loadData}
            />
          ))}
        </div>
      )}
    </div>
  )
}
