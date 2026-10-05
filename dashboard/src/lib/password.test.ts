import { describe, expect, it } from 'vitest'
import { friendlyAuthError, getPasswordStrength } from './password'

describe('getPasswordStrength', () => {
  it('is empty for an empty password', () => {
    expect(getPasswordStrength('').level).toBe(0)
  })

  it('caps anything under the minimum length at Weak, however varied', () => {
    expect(getPasswordStrength('Ab1!').label).toBe('Weak')
  })

  it('climbs with each rule met', () => {
    expect(getPasswordStrength('abcdefgh').label).toBe('Weak')
    expect(getPasswordStrength('abcdefgH').label).toBe('Fair')
    expect(getPasswordStrength('abcdefH1').label).toBe('Good')
  })

  it('only rates Strong once all rules pass and it is 12+ characters', () => {
    expect(getPasswordStrength('Abcdef1!').label).toBe('Good')
    expect(getPasswordStrength('Abcdefgh12!?').label).toBe('Strong')
  })

  it('reports which rules passed', () => {
    expect(getPasswordStrength('abcdefg1').passed).toEqual({ length: true, case: false, number: true, symbol: false })
  })
})

describe('friendlyAuthError', () => {
  it('rewrites known Supabase messages', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe('Incorrect email or password.')
    expect(friendlyAuthError('User already registered')).toMatch(/already exists/)
  })

  it('passes unknown messages through unchanged', () => {
    expect(friendlyAuthError('Something odd')).toBe('Something odd')
  })
})
