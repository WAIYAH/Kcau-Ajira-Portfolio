import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'
import FormAlert from '@/components/auth/FormAlert'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { friendlyAuthError } from '@/lib/password'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const location = useLocation()
  // Login passes along whatever was already typed into its email field.
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await resetPassword(email.trim())
    setSubmitting(false)
    if (error) setError(friendlyAuthError(error))
    else setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new one">
      {sent ? (
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck size={24} strokeWidth={2} aria-hidden="true" />
          </div>
          <p role="status" className="mt-4 text-sm text-fg-muted">
            If an account exists for <strong className="text-fg">{email.trim()}</strong>, a reset link is on its way.
            The link expires after a while, so use it soon.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              invalid={!!error}
              className="mt-1"
            />
          </div>

          {error && <FormAlert>{error}</FormAlert>}

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <Link to="/login" className="mt-6 block text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
