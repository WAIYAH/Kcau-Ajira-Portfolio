import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import type { MemberRole, MemberStatus, Profile } from '../../types'
import { RoleBadge, StatusBadge } from '../../components/Badge'
import StatCard from '../../components/StatCard'
import MemberDrawer from '../../components/members/MemberDrawer'

type StatusFilter = 'all' | MemberStatus
type RoleFilter = 'all' | MemberRole

export default function MemberList() {
  const { profile: currentProfile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [selected, setSelected] = useState<Profile | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) setError(error.message)
    else setMembers((data as Profile[]) ?? [])
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (!q) return true
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.course ?? '').toLowerCase().includes(q)
      )
    })
  }, [members, search, statusFilter, roleFilter])

  const pendingCount = members.filter((m) => m.status === 'pending').length
  const activeCount = members.filter((m) => m.status === 'active').length

  function applyUpdate(updated: Profile) {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setSelected(null)
  }

  async function quickApprove(member: Profile) {
    setBusyId(member.id)
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', member.id)
      .select()
      .single()
    setBusyId(null)
    if (error) setError(error.message)
    else if (data) applyUpdate(data as Profile)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="mt-1 text-sm text-gray-500">Approve new sign-ups, manage roles, and keep the roster current.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total members" value={String(members.length)} />
        <StatCard label="Active" value={String(activeCount)} />
        <StatCard label="Pending approval" value={String(pendingCount)} hint={pendingCount ? 'Needs review' : undefined} />
        <StatCard label="Showing" value={String(filtered.length)} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          placeholder="Search name, email, or course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue md:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="alumni">Alumni</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
        >
          <option value="all">All roles</option>
          <option value="member">Member</option>
          <option value="leader">Leader</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading members…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No members match your filters.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(member)} className="text-left hover:underline">
                      <p className="font-medium text-gray-800">
                        {member.full_name} {member.id === currentProfile?.id && <span className="text-gray-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {member.course ? `${member.course}${member.year_of_study ? ` · ${member.year_of_study}` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {format(new Date(member.joined_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {member.status === 'pending' && (
                        <button
                          onClick={() => quickApprove(member)}
                          disabled={busyId === member.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === member.id ? 'Approving…' : 'Approve'}
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(member)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && <MemberDrawer member={selected} onClose={() => setSelected(null)} onSaved={applyUpdate} />}
    </div>
  )
}
