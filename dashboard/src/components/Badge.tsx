import type { MemberRole, MemberStatus } from '../types'

const statusStyles: Record<MemberStatus, string> = {
  pending: 'bg-secondary/15 text-secondary',
  active: 'bg-success/15 text-success',
  suspended: 'bg-danger/15 text-danger',
  alumni: 'bg-fg/10 text-fg-muted',
}

const roleStyles: Record<MemberRole, string> = {
  member: 'bg-fg/10 text-fg-muted',
  leader: 'bg-primary/15 text-primary',
  admin: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
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
