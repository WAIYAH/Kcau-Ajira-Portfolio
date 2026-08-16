import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-fg-muted">
        <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
        Loading…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profile && profile.status === 'pending') {
    return <Navigate to="/pending-approval" replace />
  }

  if (profile && profile.status === 'suspended') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
