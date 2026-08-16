import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import type { LearningResource, LearningResourceType, LearningProgress, ProgressStatus } from '../../types'

const emptyForm = { title: '', type: 'article' as LearningResourceType, category: '', skillTag: '', urlOrContent: '' }

const progressLabels: Record<ProgressStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

const progressStyles: Record<ProgressStatus, string> = {
  not_started: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

const typeIcons: Record<LearningResourceType, string> = {
  article: '📄',
  video: '🎥',
  course: '🎓',
  link: '🔗',
}

export default function Learning() {
  const { profile, isStaff } = useAuth()
  const [resources, setResources] = useState<LearningResource[]>([])
  const [progress, setProgress] = useState<LearningProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [categoryFilter, setCategoryFilter] = useState('all')

  async function loadData() {
    setLoading(true)
    const [resourcesRes, progressRes] = await Promise.all([
      supabase.from('learning_resources').select('*').order('category'),
      supabase.from('learning_progress').select('*'),
    ])
    setLoading(false)
    if (resourcesRes.error) setError(resourcesRes.error.message)
    else setResources((resourcesRes.data as LearningResource[]) ?? [])
    if (progressRes.data) setProgress(progressRes.data as LearningProgress[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category))
    return Array.from(set).sort()
  }, [resources])

  const grouped = useMemo(() => {
    const filtered = categoryFilter === 'all' ? resources : resources.filter((r) => r.category === categoryFilter)
    const map = new Map<string, LearningResource[]>()
    for (const r of filtered) {
      if (!map.has(r.category)) map.set(r.category, [])
      map.get(r.category)!.push(r)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [resources, categoryFilter])

  const doneCount = progress.filter((p) => p.status === 'done').length
  const overallPct = resources.length ? Math.round((doneCount / resources.length) * 100) : 0

  function myProgress(resourceId: string) {
    return progress.find((p) => p.resource_id === resourceId && p.profile_id === profile?.id)
  }

  async function setProgressStatus(resourceId: string, status: ProgressStatus) {
    if (!profile) return
    const { data, error } = await supabase
      .from('learning_progress')
      .upsert({ profile_id: profile.id, resource_id: resourceId, status }, { onConflict: 'profile_id,resource_id' })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setProgress((prev) => {
      const withoutMine = prev.filter((p) => !(p.resource_id === resourceId && p.profile_id === profile.id))
      return [...withoutMine, data as LearningProgress]
    })
  }

  function resetForm() {
    setForm(emptyForm)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('learning_resources').insert({
      title: form.title,
      type: form.type,
      category: form.category,
      skill_tag: form.skillTag || null,
      url_or_content: form.urlOrContent,
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

  async function deleteResource(id: string) {
    if (!confirm('Remove this resource?')) return
    const { error } = await supabase.from('learning_resources').delete().eq('id', id)
    if (error) setError(error.message)
    else await loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
          <p className="mt-1 text-sm text-gray-500">Skill-tagged resources to grow your digital economy skillset.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-kca-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kca-dark"
          >
            {showForm ? 'Cancel' : '+ Add resource'}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-gray-700">Your progress</p>
          <p className="text-gray-500">
            {doneCount} / {resources.length} completed
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-kca-teal transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <label htmlFor="resource-title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="resource-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="resource-type" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="resource-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as LearningResourceType })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="course">Course</option>
              <option value="link">Link</option>
            </select>
          </div>

          <div>
            <label htmlFor="resource-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="resource-category"
              required
              placeholder="e.g. Web Development, AI, Freelancing"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div>
            <label htmlFor="resource-skill-tag" className="block text-sm font-medium text-gray-700">Skill tag (optional)</label>
            <input
              id="resource-skill-tag"
              placeholder="e.g. React, Copywriting"
              value={form.skillTag}
              onChange={(e) => setForm({ ...form, skillTag: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="resource-url" className="block text-sm font-medium text-gray-700">URL or content</label>
            <input
              id="resource-url"
              required
              placeholder="https://… or a short write-up"
              value={form.urlOrContent}
              onChange={(e) => setForm({ ...form, urlOrContent: e.target.value })}
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
              {saving ? 'Saving…' : 'Save resource'}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          onClick={() => setCategoryFilter('all')}
          aria-pressed={categoryFilter === 'all'}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            categoryFilter === 'all' ? 'bg-kca-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            aria-pressed={categoryFilter === c}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              categoryFilter === c ? 'bg-kca-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading resources…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-gray-400">No learning resources yet.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{category}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((resource) => {
                  const mine = myProgress(resource.id)
                  const status = mine?.status ?? 'not_started'
                  return (
                    <div key={resource.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {typeIcons[resource.type]} {resource.title}
                        </p>
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${progressStyles[status]}`}>
                          {progressLabels[status]}
                        </span>
                      </div>
                      {resource.skill_tag && <p className="mt-1 text-xs text-gray-400">Skill: {resource.skill_tag}</p>}
                      <a
                        href={resource.url_or_content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block truncate text-xs text-kca-blue hover:underline"
                      >
                        {resource.url_or_content}
                      </a>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(['not_started', 'in_progress', 'done'] as ProgressStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setProgressStatus(resource.id, s)}
                            aria-pressed={status === s}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${
                              status === s ? 'border-kca-blue bg-kca-blue text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {progressLabels[s]}
                          </button>
                        ))}
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => deleteResource(resource.id)}
                          className="mt-3 text-[11px] font-medium text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
