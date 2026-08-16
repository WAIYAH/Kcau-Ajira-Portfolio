import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function SignUp() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signUp(email, password, fullName)
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="Almost there">
        <p className="text-sm text-fg-muted">
          We sent a confirmation link to <strong className="text-fg">{email}</strong>. Once confirmed, a club leader
          will need to approve your membership before you can access the dashboard.
        </p>
        <Link to="/login" className="mt-6 block text-center text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the KCA Ajira Club member dashboard">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-fg">
            Full name
          </label>
          <Input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-fg">
            Email
          </label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-fg">
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-fg-subtle">At least 8 characters.</p>
        </div>

        {error && <p className="text-sm text-danger-ink">{error}</p>}

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
