import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Check, MailCheck } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout'
import FormAlert from '@/components/auth/FormAlert'
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import { PASSWORD_MIN_LENGTH, friendlyAuthError } from '@/lib/password'

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword'

export default function SignUp() {
  const { session, signUp, resendConfirmation } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [resent, setResent] = useState(false)
  const refs = {
    fullName: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirmPassword: useRef<HTMLInputElement>(null),
  }

  if (session) return <Navigate to="/" replace />

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password
  // Only complain about a mismatch once they've finished typing the
  // confirmation (left the field), or it nags on every keystroke.
  const showMismatch = (confirmTouched || !!fieldErrors.confirmPassword) && confirmPassword.length > 0 && !passwordsMatch

  function validate(): Partial<Record<Field, string>> {
    const errs: Partial<Record<Field, string>> = {}
    if (fullName.trim().length < 2) errs.fullName = 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Please enter a valid email address.'
    if (password.length < PASSWORD_MIN_LENGTH) errs.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.'
    else if (confirmPassword !== password) errs.confirmPassword = "Passwords don't match."
    return errs
  }

  function clearFieldError(field: Field) {
    if (fieldErrors[field]) setFieldErrors(({ [field]: _removed, ...rest }) => rest)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const errs = validate()
    setFieldErrors(errs)
    const firstInvalid = (Object.keys(refs) as Field[]).find((f) => errs[f])
    if (firstInvalid) {
      refs[firstInvalid].current?.focus()
      return
    }

    setSubmitting(true)
    const { error } = await signUp(email.trim(), password, fullName.trim())
    setSubmitting(false)
    if (error) setError(friendlyAuthError(error))
    else setDone(true)
  }

  async function handleResend() {
    setSubmitting(true)
    const { error } = await resendConfirmation(email.trim())
    setSubmitting(false)
    if (error) setError(friendlyAuthError(error))
    else {
      setError(null)
      setResent(true)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to join">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck size={24} strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm text-fg-muted">
            We sent a confirmation link to <strong className="text-fg">{email.trim()}</strong>. Once you confirm, a club
            leader will review and approve your membership before you can access the dashboard.
          </p>
          <p className="mt-3 text-xs text-fg-subtle">Can't find it? Check your spam or promotions folder.</p>
        </div>

        <div className="mt-6 space-y-3">
          {error && <FormAlert>{error}</FormAlert>}
          {resent && <FormAlert tone="success">Sent again — give it a minute to arrive.</FormAlert>}
          <Button variant="secondary" onClick={handleResend} loading={submitting} disabled={resent} className="w-full">
            {resent ? 'Email sent' : 'Resend confirmation email'}
          </Button>
          <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const fieldError = (f: Field) =>
    fieldErrors[f] ? (
      <p id={`${f}-error`} className="mt-1 text-xs text-danger-ink">
        {fieldErrors[f]}
      </p>
    ) : null

  return (
    <AuthLayout title="Create your account" subtitle="Join the KCA Ajira Club member dashboard">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-fg">
            Full name
          </label>
          <Input
            ref={refs.fullName}
            id="fullName"
            type="text"
            required
            autoFocus
            autoComplete="name"
            autoCapitalize="words"
            placeholder="e.g. Jane Wanjiku"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              clearFieldError('fullName')
            }}
            invalid={!!fieldErrors.fullName}
            aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
            className="mt-1"
          />
          {fieldError('fullName')}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-fg">
            Email
          </label>
          <Input
            ref={refs.email}
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError('email')
            }}
            invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className="mt-1"
          />
          {fieldError('email')}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-fg">
            Password
          </label>
          <PasswordInput
            ref={refs.password}
            id="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error password-strength' : 'password-strength'}
            className="mt-1"
          />
          {fieldError('password')}
          <PasswordStrengthMeter id="password-strength" password={password} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-fg">
            Confirm password
          </label>
          <PasswordInput
            ref={refs.confirmPassword}
            id="confirmPassword"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              clearFieldError('confirmPassword')
            }}
            onBlur={() => setConfirmTouched(true)}
            invalid={showMismatch || !!fieldErrors.confirmPassword}
            aria-describedby="confirmPassword-error"
            className="mt-1"
          />
          <div id="confirmPassword-error" aria-live="polite">
            {fieldErrors.confirmPassword && !showMismatch ? (
              <p className="mt-1 text-xs text-danger-ink">{fieldErrors.confirmPassword}</p>
            ) : showMismatch ? (
              <p className="mt-1 text-xs text-danger-ink">Passwords don't match.</p>
            ) : passwordsMatch ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-success-ink">
                <Check size={12} strokeWidth={3} aria-hidden="true" /> Passwords match
              </p>
            ) : null}
          </div>
        </div>

        {error && (
          <FormAlert>
            {error}
            {error.startsWith('An account with this email') && (
              <Link to="/login" className="mt-1 block font-semibold underline underline-offset-2 hover:no-underline">
                Go to sign in
              </Link>
            )}
          </FormAlert>
        )}

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-fg-subtle">
          New accounts are reviewed by a club leader before you can access the dashboard.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
