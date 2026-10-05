import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import SignUp from './SignUp'
import { useAuth } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
// Logo reads the theme; the auth screens don't care which one.
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }))

const auth = {
  session: null,
  profile: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resendConfirmation: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue(auth as unknown as ReturnType<typeof useAuth>)
})

function renderAt(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('password visibility toggle', () => {
  it('shows and hides the password', async () => {
    const user = userEvent.setup()
    renderAt(<Login />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('Login', () => {
  it('shows a friendly error for bad credentials', async () => {
    auth.signIn.mockResolvedValue({ error: 'Invalid login credentials' })
    const user = userEvent.setup()
    renderAt(<Login />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
  })

  it('offers to resend the confirmation email when unconfirmed', async () => {
    auth.signIn.mockResolvedValue({ error: 'Email not confirmed' })
    auth.resendConfirmation.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderAt(<Login />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'whatever1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await user.click(await screen.findByRole('button', { name: 'Resend confirmation email' }))
    expect(auth.resendConfirmation).toHaveBeenCalledWith('a@b.co')
    expect(await screen.findByText(/Confirmation email sent/)).toBeInTheDocument()
  })
})

describe('SignUp', () => {
  async function fill(password: string, confirm: string) {
    const user = userEvent.setup()
    renderAt(<SignUp />)
    await user.type(screen.getByLabelText('Full name'), 'Jane Wanjiku')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), password)
    await user.type(screen.getByLabelText('Confirm password'), confirm)
    return user
  }

  it('blocks submission when the passwords differ', async () => {
    const user = await fill('Abcdef12!', 'Abcdef12?')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toHaveFocus()
  })

  it('blocks a password under the minimum length', async () => {
    const user = await fill('short', 'short')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(screen.getByText(/at least 8 characters\./)).toBeInTheDocument()
  })

  it('confirms a match and signs up with trimmed values', async () => {
    auth.signUp.mockResolvedValue({ error: null })
    const user = await fill('Abcdef12!', 'Abcdef12!')
    expect(screen.getByText('Passwords match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(auth.signUp).toHaveBeenCalledWith('jane@example.com', 'Abcdef12!', 'Jane Wanjiku')
    expect(await screen.findByText('Check your email')).toBeInTheDocument()
  })

  it('explains when the email is already registered', async () => {
    auth.signUp.mockResolvedValue({ error: 'User already registered' })
    const user = await fill('Abcdef12!', 'Abcdef12!')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/)
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toBeInTheDocument()
  })
})
