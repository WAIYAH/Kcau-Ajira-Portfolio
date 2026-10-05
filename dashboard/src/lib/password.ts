// Shared password rules for every screen that sets a password (sign-up and
// reset). Supabase only enforces its own minimum length server-side, so these
// are the club's guidance on top of that — only `minLength` actually blocks
// submission; the rest feed the strength meter.

export const PASSWORD_MIN_LENGTH = 8

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const passwordRules: PasswordRule[] = [
  { id: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'case', label: 'Upper- and lowercase letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'A symbol (e.g. ! @ # ?)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export interface PasswordStrength {
  /** 0 = empty, 1 = weak … 4 = strong */
  level: StrengthLevel
  label: string
  passed: Record<string, boolean>
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const

export function getPasswordStrength(password: string): PasswordStrength {
  const passed = Object.fromEntries(passwordRules.map((r) => [r.id, r.test(password)]))
  if (!password) return { level: 0, label: LABELS[0], passed }

  // A short password is weak however varied it is — length matters most.
  if (!passed.length) return { level: 1, label: LABELS[1], passed }

  let level = Object.values(passed).filter(Boolean).length as StrengthLevel
  if (level === 4 && password.length < 12) level = 3
  return { level, label: LABELS[level], passed }
}

// Supabase returns raw English error strings; map the common ones to
// friendlier copy and fall through to the original for anything else.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'Please confirm your email address first — check your inbox for the link.'
  if (m.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Too many attempts. Please wait a minute and try again.'
  if (m.includes('should be different from the old password')) return 'Your new password must be different from your current one.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.'
  return message
}
