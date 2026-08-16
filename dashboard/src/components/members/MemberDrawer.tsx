import { useLayoutEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/lib/audit'
import type { MemberRole, MemberStatus, Profile } from '@/types'
import { RoleBadge, StatusBadge } from '@/components/Badge'
import Drawer from '@/components/ui/Drawer'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const statusOptions: MemberStatus[] = ['pending', 'active', 'suspended', 'alumni']

const detailFields: { label: string; key: keyof Profile }[] = [
  { label: 'Phone', key: 'phone' },
  { label: 'University ID', key: 'university_id' },
  { label: 'Course', key: 'course' },
  { label: 'Year of study', key: 'year_of_study' },
]

interface MemberDrawerProps {
  member: Profile | null
  onClose: () => void
  onSaved: (updated: Profile) => void
}

export default function MemberDrawer({ member, onClose, onSaved }: MemberDrawerProps) {
  const { isAdmin, profile: currentProfile } = useAuth()
  // Keeps rendering the last-selected member's data while the drawer's exit
  // animation plays, instead of blanking to null the instant the caller clears
  // `member` — useLayoutEffect so it's committed before paint, no flash open.
  const [displayMember, setDisplayMember] = useState<Profile | null>(member)
  const [status, setStatus] = useState<MemberStatus>('pending')
  const [role, setRole] = useState<MemberRole>('member')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (member) {
      setDisplayMember(member)
      setStatus(member.status)
      setRole(member.role)
      setError(null)
    }
  }, [member])

  if (!displayMember) return null

  const roleOptions: MemberRole[] = isAdmin ? ['member', 'leader', 'admin'] : ['member', 'leader']
  const isSelf = currentProfile?.id === displayMember.id

  async function handleSave() {
    if (!displayMember) return
    setSaving(true)
    setError(null)
    const { data, error } = await supabase.from('profiles').update({ status, role }).eq('id', displayMember.id).select().single()
    setSaving(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      if (status !== displayMember.status || role !== displayMember.role) {
        logAudit('update_member', 'profiles', displayMember.id, {
          from: { role: displayMember.role, status: displayMember.status },
          to: { role, status },
        })
      }
      onSaved(data as Profile)
    }
  }

  return (
    <Drawer open={!!member} onClose={onClose} title={displayMember.full_name}>
      <p className="-mt-2 text-sm text-fg-muted">{displayMember.email}</p>

      <div className="mt-3 flex gap-2">
        <StatusBadge status={displayMember.status} />
        <RoleBadge role={displayMember.role} />
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        {detailFields.map(({ label, key }) => (
          <div key={key} className="flex justify-between border-b border-border pb-2">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="text-fg">{(displayMember[key] as string | null) || '—'}</dd>
          </div>
        ))}
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-fg-muted">Joined</dt>
          <dd className="text-fg">{format(new Date(displayMember.joined_at), 'MMM d, yyyy')}</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-4 border-t border-border pt-6">
        <div>
          <label htmlFor="member-status" className="block text-sm font-medium text-fg">
            Status
          </label>
          <Select
            id="member-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MemberStatus)}
            className="mt-1 capitalize"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="member-role" className="block text-sm font-medium text-fg">
            Role
          </label>
          <Select
            id="member-role"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="mt-1 capitalize"
          >
            {roleOptions.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </Select>
          {isSelf && <p className="mt-1 text-xs text-fg-subtle">You can't change your own role here.</p>}
          {!isAdmin && <p className="mt-1 text-xs text-fg-subtle">Only an admin can grant the admin role.</p>}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={handleSave} loading={saving} disabled={isSelf} className="w-full">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Drawer>
  )
}
