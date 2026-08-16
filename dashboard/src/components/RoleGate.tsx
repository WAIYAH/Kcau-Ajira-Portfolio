import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

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
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        You don't have access to this section. It's reserved for admins.
      </div>
    )
  }

  if (staffOnly && !isStaff) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        You don't have access to this section. It's reserved for club leaders and admins.
      </div>
    )
  }

  return <>{children}</>
}
