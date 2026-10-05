import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'
import FormAlert from '@/components/auth/FormAlert'
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter'
import { useAuth } from '@/contexts/AuthContext'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import { PASSWORD_MIN_LENGTH, friendlyAuthError } from '@/lib/password'

// Landing page for the link in the "reset password" email (see
// resetPassword's redirectTo in AuthContext). supabase-js reads the recovery
// token from the URL and signs the person in with a short-lived session,
// which is what lets updateUser() set the new password here.
export default function ResetPassword() {
  const { session, loading, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <AuthLayout title="Choose a new password" subtitle="Verifying your reset link…">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-fg-muted">
          <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
          Verifying…
        </div>
      </AuthLayout>
    )
  }

  if (!session) {
    return (
      <AuthLayout title="Link expired" subtitle="This password reset link is no longer valid">
        <p className="text-sm text-fg-muted">
          Reset links can only be used once and expire after a short time. Request a new one and use it straight away.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 flex h-10 w-full items-center justify-center rounded-control bg-primary-solid text-sm font-medium text-white shadow-elevate-xs transition-colors hover:bg-primary-hover"
        >
          Request a new link
        </Link>
        <Link to="/login" className="mt-4 block text-center text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
      return
    }
    if (!passwordsMatch) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    const { error } = await updatePassword(password)
    if (error) {
      setSubmitting(false)
      setError(friendlyAuthError(error))
      return
    }
    // Sign out so they prove the new password works, rather than silently
    // carrying on in the recovery session.
    await signOut()
    navigate('/login', { replace: true, state: { reason: 'password-updated' } })
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${session.user.email ?? 'your account'}`}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-fg">
            New password
          </label>
          <PasswordInput
            id="password"
            required
            autoFocus
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-strength"
            className="mt-1"
          />
          <PasswordStrengthMeter id="password-strength" password={password} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-fg">
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            invalid={confirmPassword.length >= password.length && confirmPassword.length > 0 && !passwordsMatch}
            className="mt-1"
          />
        </div>

        {error && <FormAlert>{error}</FormAlert>}

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
