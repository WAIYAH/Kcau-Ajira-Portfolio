import { useState, type ChangeEvent, type FormEvent } from 'react'
import { format } from 'date-fns'
import { Camera, FileText, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { RoleBadge, StatusBadge } from '@/components/Badge'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import TagInput from '@/components/ui/TagInput'

const MAX_CV_BYTES = 5 * 1024 * 1024

export function cvFileName(path: string) {
  const raw = path.split('/').pop() ?? path
  // Stored as `${uuid}-${original filename}` — strip the uuid prefix for display.
  return raw.replace(/^[0-9a-f-]{36}-/i, '')
}

// `avatar_url` is a full public URL (avatars is a public bucket); storage
// deletion needs the bare object path, which sits right after the bucket
// name in that URL.
export function avatarPathFromUrl(url: string) {
  const marker = '/avatars/'
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
}

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [course, setCourse] = useState(profile?.course ?? '')
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState<string | null>(null)

  if (!profile) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, course, year_of_study: yearOfStudy, bio, skills })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) setMessage(error.message)
    else {
      setMessage('Profile updated.')
      await refreshProfile()
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile) return
    setAvatarError(null)
    setAvatarUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
    if (uploadError) {
      setAvatarUploading(false)
      setAvatarError(uploadError.message)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const previousUrl = profile.avatar_url
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
    setAvatarUploading(false)
    if (updateError) {
      setAvatarError(updateError.message)
      return
    }
    await refreshProfile()
    // Best-effort cleanup of the replaced file — the profile already points
    // at the new one, so a failure here just leaves an orphaned object.
    const previousPath = previousUrl && avatarPathFromUrl(previousUrl)
    if (previousPath) await supabase.storage.from('avatars').remove([previousPath])
  }

  async function handleRemoveAvatar() {
    setAvatarError(null)
    setAvatarUploading(true)
    const previousUrl = profile!.avatar_url
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile!.id)
    setAvatarUploading(false)
    if (error) {
      setAvatarError(error.message)
      return
    }
    await refreshProfile()
    const previousPath = previousUrl && avatarPathFromUrl(previousUrl)
    if (previousPath) await supabase.storage.from('avatars').remove([previousPath])
  }

  async function handleCvChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile) return
    if (file.size > MAX_CV_BYTES) {
      setCvError('File is too large — max 5MB.')
      return
    }
    setCvError(null)
    setCvUploading(true)
    const path = `${profile.id}/${crypto.randomUUID()}-${file.name}`
    const previousPath = profile.cv_url
    const { error: uploadError } = await supabase.storage.from('cvs').upload(path, file)
    if (uploadError) {
      setCvUploading(false)
      setCvError(uploadError.message)
      return
    }
    const { error: updateError } = await supabase.from('profiles').update({ cv_url: path }).eq('id', profile.id)
    setCvUploading(false)
    if (updateError) {
      setCvError(updateError.message)
      return
    }
    await refreshProfile()
    if (previousPath) await supabase.storage.from('cvs').remove([previousPath])
  }

  async function viewCv() {
    if (!profile?.cv_url) return
    const { data, error } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_url, 60)
    if (error) setCvError(error.message)
    else window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function removeCv() {
    setCvError(null)
    setCvUploading(true)
    const previousPath = profile!.cv_url
    const { error } = await supabase.from('profiles').update({ cv_url: null }).eq('id', profile!.id)
    setCvUploading(false)
    if (error) {
      setCvError(error.message)
      return
    }
    await refreshProfile()
    if (previousPath) await supabase.storage.from('cvs').remove([previousPath])
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-fg">My Profile</h1>
      <p className="mt-1 text-sm text-fg-muted">Keep your details, skills, and CV up to date.</p>

      <Card padding="lg" className="mt-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-primary-solid text-white shadow-elevate-xs transition-colors hover:bg-primary-hover"
          >
            <Camera size={15} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Change profile photo</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-fg/50">
              <Loader2 size={20} className="animate-spin text-white" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-fg">{profile.full_name}</h2>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <StatusBadge status={profile.status} />
            <RoleBadge role={profile.role} />
          </div>
          <p className="mt-2 text-sm text-fg-muted">Member since {format(new Date(profile.joined_at), 'MMMM yyyy')}</p>
          {profile.avatar_url && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarUploading}
              className="mt-2 text-sm font-medium text-danger-ink hover:underline disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
          {avatarError && <p className="mt-2 text-sm text-danger-ink">{avatarError}</p>}
        </div>
      </Card>

      <Card padding="lg" className="mt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg">Email</label>
              <Input disabled value={profile.email} className="mt-1" />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-fg">
                Full name
              </label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-fg">
                Phone
              </label>
              <Input id="phone" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label htmlFor="course" className="block text-sm font-medium text-fg">
                Course
              </label>
              <Input id="course" value={course ?? ''} onChange={(e) => setCourse(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-fg">
                Year of study
              </label>
              <Input id="year" value={yearOfStudy ?? ''} onChange={(e) => setYearOfStudy(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <label htmlFor="bio" className="block text-sm font-medium text-fg">
              About
            </label>
            <p className="mt-0.5 text-xs text-fg-muted">A short bio — your interests, goals, or what you're working on.</p>
            <Textarea
              id="bio"
              value={bio ?? ''}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tell the club a bit about yourself…"
              className="mt-2"
            />
            <p className="mt-1 text-right text-xs text-fg-subtle">{(bio ?? '').length}/500</p>
          </div>

          <div className="border-t border-border pt-6">
            <label htmlFor="skill-input" className="block text-sm font-medium text-fg">
              Skills
            </label>
            <p className="mt-0.5 text-xs text-fg-muted">Add skills one at a time — press Enter or comma to add.</p>
            <TagInput
              id="skill-input"
              values={skills}
              onChange={setSkills}
              placeholder="e.g. Python, Graphic design, Public speaking"
              className="mt-3"
            />
          </div>

          {message && <p className="text-sm text-fg-muted">{message}</p>}

          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      <Card padding="lg" className="mt-6">
        <h2 className="text-sm font-medium text-fg">CV / Résumé</h2>
        <p className="mt-0.5 text-xs text-fg-muted">Upload a PDF or Word document (max 5MB). Only you and club leaders can view it.</p>

        {profile.cv_url ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-control border border-border bg-bg px-3 py-2.5">
            <button
              type="button"
              onClick={viewCv}
              className="flex min-w-0 items-center gap-2 text-sm font-medium text-fg hover:text-primary"
            >
              <FileText size={16} strokeWidth={1.75} className="shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="truncate">{cvFileName(profile.cv_url)}</span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <label
                htmlFor="cv-upload"
                className="cursor-pointer rounded-control px-2 py-1 text-xs font-medium text-fg-muted hover:bg-fg/5 hover:text-fg"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={removeCv}
                disabled={cvUploading}
                aria-label="Remove CV"
                className="rounded-control p-1.5 text-fg-muted hover:bg-danger/10 hover:text-danger-ink disabled:opacity-50"
              >
                {cvUploading ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="cv-upload"
            className="mt-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-control border border-dashed border-border py-6 text-center hover:border-primary hover:bg-primary/5"
          >
            {cvUploading ? (
              <Loader2 size={20} className="animate-spin text-fg-subtle" aria-hidden="true" />
            ) : (
              <FileText size={20} strokeWidth={1.75} className="text-fg-subtle" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-fg">{cvUploading ? 'Uploading…' : 'Click to upload your CV'}</span>
            <span className="text-xs text-fg-muted">PDF or Word, max 5MB</span>
          </label>
        )}

        <input
          id="cv-upload"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={handleCvChange}
          disabled={cvUploading}
        />

        {cvError && <p className="mt-2 text-sm text-danger-ink">{cvError}</p>}
      </Card>
    </div>
  )
}
