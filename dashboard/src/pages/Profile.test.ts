import { describe, expect, it } from 'vitest'
import { avatarPathFromUrl, cvFileName } from './Profile'

describe('avatarPathFromUrl', () => {
  it('extracts the storage object path from a public Supabase Storage URL', () => {
    const url = 'https://cjntpaqafyvzyiyfgekm.supabase.co/storage/v1/object/public/avatars/user-1/abc-123.jpg'
    expect(avatarPathFromUrl(url)).toBe('user-1/abc-123.jpg')
  })

  it('returns null when the URL has no /avatars/ segment', () => {
    expect(avatarPathFromUrl('https://example.com/not-an-avatar.jpg')).toBeNull()
  })
})

describe('cvFileName', () => {
  it('strips the UUID prefix used to make storage paths unique', () => {
    expect(cvFileName('user-1/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d-resume.pdf')).toBe('resume.pdf')
  })

  it('returns the raw filename unchanged when there is no UUID prefix', () => {
    expect(cvFileName('user-1/resume.pdf')).toBe('resume.pdf')
  })

  it('handles a bare filename with no folder segment', () => {
    expect(cvFileName('resume.pdf')).toBe('resume.pdf')
  })
})
