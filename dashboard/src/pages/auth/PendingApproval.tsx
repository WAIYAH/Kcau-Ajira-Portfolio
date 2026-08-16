import AuthLayout from '@/components/layout/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

export default function PendingApproval() {
  const { profile, signOut } = useAuth()

  return (
    <AuthLayout title="Almost there" subtitle="Your membership is pending approval">
      <p className="text-sm text-fg-muted">
        Hi {profile?.full_name ?? 'there'}, your account has been created but a club leader still needs to approve
        your membership before you can access the dashboard. You'll be notified by email once you're approved.
      </p>
      <Button variant="secondary" onClick={() => signOut()} className="mt-6 w-full">
        Sign out
      </Button>
    </AuthLayout>
  )
}
