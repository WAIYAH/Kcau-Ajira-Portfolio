import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import FormAlert from '@/components/auth/FormAlert'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import { friendlyAuthError } from '@/lib/password'

interface LoginState {
  from?: string
  reason?: 'suspended' | 'password-updated'
}

export default function Login() {
  const { session, profile, signIn, signOut, resendConfirmation } = useAuth()
  const location = useLocation()
  const state = (location.state as LoginState | null) ?? {}
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [suspended, setSuspended] = useState(state.reason === 'suspended')

  const isSuspended = profile?.status === 'suspended'

  // ProtectedRoute bounces suspended members here, but they still hold a
  // session — redirecting them back to "/" would loop forever. End the
  // session and explain why instead.
  useEffect(() => {
    if (session && isSuspended) {
      setSuspended(true)
      void signOut()
    }
  }, [session, isSuspended, signOut])

  if (session && !isSuspended) {
    return <Navigate to={state.from ?? '/'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setUnconfirmed(false)
    setResent(false)
    setSuspended(false)
    setSubmitting(true)
    const { error } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (error) {
      setError(friendlyAuthError(error))
      setUnconfirmed(error.toLowerCase().includes('email not confirmed'))
    }
  }

  async function handleResend() {
    setSubmitting(true)
    const { error } = await resendConfirmation(email.trim())
    setSubmitting(false)
    if (error) {
      setError(friendlyAuthError(error))
      setUnconfirmed(false)
    } else {
      setError(null)
      setResent(true)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your member dashboard">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {state.reason === 'password-updated' && !error && (
          <FormAlert tone="success">Your password has been updated. Sign in with your new password.</FormAlert>
        )}
        {suspended && (
          <FormAlert>This account has been suspended. Please contact a club leader if you think this is a mistake.</FormAlert>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-fg">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!error && !unconfirmed}
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-fg">
              Password
            </label>
            <Link
              to="/forgot-password"
              state={{ email: email.trim() }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!error && !unconfirmed}
            className="mt-1"
          />
        </div>

        {error && (
          <FormAlert>
            {error}
            {unconfirmed && (
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="mt-1 block font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                Resend confirmation email
              </button>
            )}
          </FormAlert>
        )}
        {resent && (
          <FormAlert tone="success">
            Confirmation email sent to <strong>{email.trim()}</strong>. Check your inbox (and spam folder).
          </FormAlert>
        )}

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        New to the club?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
