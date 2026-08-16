import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoleGate from './RoleGate'
import { useAuth } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const mockAuth = vi.mocked(useAuth)

function authAs(role: 'member' | 'leader' | 'admin') {
  mockAuth.mockReturnValue({
    isStaff: role === 'leader' || role === 'admin',
    isAdmin: role === 'admin',
  } as ReturnType<typeof useAuth>)
}

describe('RoleGate', () => {
  it('renders children with no restriction for any role', () => {
    authAs('member')
    render(
      <RoleGate>
        <p>secret content</p>
      </RoleGate>,
    )
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('blocks a plain member from a staffOnly section', () => {
    authAs('member')
    render(
      <RoleGate staffOnly>
        <p>staff content</p>
      </RoleGate>,
    )
    expect(screen.queryByText('staff content')).not.toBeInTheDocument()
    expect(screen.getByText('Leaders and admins only')).toBeInTheDocument()
  })

  it('lets a leader into a staffOnly section', () => {
    authAs('leader')
    render(
      <RoleGate staffOnly>
        <p>staff content</p>
      </RoleGate>,
    )
    expect(screen.getByText('staff content')).toBeInTheDocument()
  })

  it('blocks a leader (non-admin) from an adminOnly section', () => {
    authAs('leader')
    render(
      <RoleGate adminOnly>
        <p>admin content</p>
      </RoleGate>,
    )
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
    expect(screen.getByText('Admins only')).toBeInTheDocument()
  })

  it('lets an admin into an adminOnly section', () => {
    authAs('admin')
    render(
      <RoleGate adminOnly>
        <p>admin content</p>
      </RoleGate>,
    )
    expect(screen.getByText('admin content')).toBeInTheDocument()
  })
})
