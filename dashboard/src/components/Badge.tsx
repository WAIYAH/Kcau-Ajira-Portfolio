import type { MemberRole, MemberStatus } from '../types'

const statusStyles: Record<MemberStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  alumni: 'bg-gray-100 text-gray-600',
}

const roleStyles: Record<MemberRole, string> = {
  member: 'bg-gray-100 text-gray-600',
  leader: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

function Pill({ className, children }: { className: string; children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <Pill className={statusStyles[status]}>{status}</Pill>
}

export function RoleBadge({ role }: { role: MemberRole }) {
  return <Pill className={roleStyles[role]}>{role}</Pill>
}
