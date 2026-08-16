import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EmptyState from './ui/EmptyState'

export default function RoleGate({
  staffOnly,
  adminOnly,
  children,
}: {
  staffOnly?: boolean
  adminOnly?: boolean
  children: ReactNode
}) {
  const { isStaff, isAdmin } = useAuth()

  if (adminOnly && !isAdmin) {
    return <EmptyState icon={ShieldAlert} title="Admins only" description="This section is reserved for admins." />
  }

  if (staffOnly && !isStaff) {
    return (
      <EmptyState icon={ShieldAlert} title="Leaders and admins only" description="This section is reserved for club leaders and admins." />
    )
  }

  return <>{children}</>
}
