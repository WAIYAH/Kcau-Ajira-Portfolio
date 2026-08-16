import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [course, setCourse] = useState(profile?.course ?? '')
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!profile) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, course, year_of_study: yearOfStudy })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) setMessage(error.message)
    else {
      setMessage('Profile updated.')
      await refreshProfile()
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-fg">My Profile</h1>
      <p className="mt-1 text-sm text-fg-muted">Keep your details up to date.</p>

      <Card padding="lg" className="mt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
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

          {message && <p className="text-sm text-fg-muted">{message}</p>}

          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
