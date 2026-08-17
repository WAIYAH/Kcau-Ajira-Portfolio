import { describe, expect, it } from 'vitest'
import { buildNavItems, filterNavItems } from './commandPalette'

describe('buildNavItems', () => {
  it('includes only member links for a plain member', () => {
    const items = buildNavItems(false, false)
    expect(items.some((i) => i.label === 'Members')).toBe(false)
    expect(items.some((i) => i.label === 'Audit Log')).toBe(false)
    expect(items.some((i) => i.label === 'My Profile')).toBe(true)
  })

  it('adds staff links for a leader', () => {
    const items = buildNavItems(true, false)
    expect(items.some((i) => i.label === 'Members')).toBe(true)
    expect(items.some((i) => i.label === 'Audit Log')).toBe(false)
  })

  it('adds admin links for an admin', () => {
    const items = buildNavItems(true, true)
    expect(items.some((i) => i.label === 'Audit Log')).toBe(true)
  })
})

describe('filterNavItems', () => {
  const items = buildNavItems(true, true)

  it('returns every item for an empty query', () => {
    expect(filterNavItems(items, '')).toHaveLength(items.length)
  })

  it('matches case-insensitively on a substring', () => {
    const matches = filterNavItems(items, 'financ')
    expect(matches.map((i) => i.label)).toEqual(['Finance'])
  })

  it('returns nothing for a query that matches no label', () => {
    expect(filterNavItems(items, 'xyzzy')).toHaveLength(0)
  })
})
