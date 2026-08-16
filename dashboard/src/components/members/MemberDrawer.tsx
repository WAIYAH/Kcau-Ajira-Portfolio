import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { logAudit } from '../../lib/audit'
import type { MemberRole, MemberStatus, Profile } from '../../types'
import { RoleBadge, StatusBadge } from '../Badge'

const statusOptions: MemberStatus[] = ['pending', 'active', 'suspended', 'alumni']

export default function MemberDrawer({
  member,
  onClose,
  onSaved,
}: {
  member: Profile
  onClose: () => void
  onSaved: (updated: Profile) => void
}) {
  const { isAdmin, profile: currentProfile } = useAuth()
  const [status, setStatus] = useState<MemberStatus>(member.status)
  const [role, setRole] = useState<MemberRole>(member.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStatus(member.status)
    setRole(member.role)
    setError(null)
  }, [member])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const roleOptions: MemberRole[] = isAdmin ? ['member', 'leader', 'admin'] : ['member', 'leader']
  const isSelf = currentProfile?.id === member.id

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .update({ status, role })
      .eq('id', member.id)
      .select()
      .single()
    setSaving(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      if (status !== member.status || role !== member.role) {
        logAudit('update_member', 'profiles', member.id, {
          from: { role: member.role, status: member.status },
          to: { role, status },
        })
      }
      onSaved(data as Profile)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-drawer-title"
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="member-drawer-title" className="text-lg font-bold text-gray-900">
              {member.full_name}
            </h2>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <StatusBadge status={member.status} />
          <RoleBadge role={member.role} />
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-800">{member.phone || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">University ID</dt>
            <dd className="text-gray-800">{member.university_id || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Course</dt>
            <dd className="text-gray-800">{member.course || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Year of study</dt>
            <dd className="text-gray-800">{member.year_of_study || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-500">Joined</dt>
            <dd className="text-gray-800">{format(new Date(member.joined_at), 'MMM d, yyyy')}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
          <div>
            <label htmlFor="member-status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="member-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="member-role"
              value={role}
              disabled={isSelf}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue disabled:bg-gray-50 disabled:text-gray-400"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </select>
            {isSelf && <p className="mt-1 text-xs text-gray-400">You can't change your own role here.</p>}
            {!isAdmin && <p className="mt-1 text-xs text-gray-400">Only an admin can grant the admin role.</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || isSelf}
            className="w-full rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
