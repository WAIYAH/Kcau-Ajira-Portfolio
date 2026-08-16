import { describe, expect, it } from 'vitest'
import { statusFor } from './Dues'

describe('statusFor', () => {
  it('is unpaid when nothing has been paid', () => {
    expect(statusFor(1000, 0)).toBe('unpaid')
  })

  it('is unpaid when a negative amount is somehow recorded', () => {
    expect(statusFor(1000, -50)).toBe('unpaid')
  })

  it('is partial when some but not all has been paid', () => {
    expect(statusFor(1000, 400)).toBe('partial')
  })

  it('is paid when the full amount has been paid', () => {
    expect(statusFor(1000, 1000)).toBe('paid')
  })

  it('is paid when overpaid', () => {
    expect(statusFor(1000, 1200)).toBe('paid')
  })
})
