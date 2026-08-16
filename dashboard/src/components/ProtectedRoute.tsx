import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
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
