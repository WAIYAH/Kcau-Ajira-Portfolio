import AuthLayout from '../../components/layout/AuthLayout'
import { useAuth } from '../../contexts/AuthContext'

export default function PendingApproval() {
  const { profile, signOut } = useAuth()

  return (
    <AuthLayout title="Almost there" subtitle="Your membership is pending approval">
      <p className="text-sm text-gray-600">
        Hi {profile?.full_name ?? 'there'}, your account has been created but a club leader still needs to approve
        your membership before you can access the dashboard. You'll be notified by email once you're approved.
      </p>
      <button
        onClick={() => signOut()}
        className="mt-6 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        Sign out
      </button>
    </AuthLayout>
  )
}
