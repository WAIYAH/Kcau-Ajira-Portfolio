import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

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
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <p className="mt-1 text-sm text-gray-500">Keep your details up to date.</p>

      <form className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            disabled
            value={profile.email}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="phone"
            value={phone ?? ''}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700">
            Course
          </label>
          <input
            id="course"
            value={course ?? ''}
            onChange={(e) => setCourse(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year of study
          </label>
          <input
            id="year"
            value={yearOfStudy ?? ''}
            onChange={(e) => setYearOfStudy(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-kca-blue focus:outline-none focus:ring-1 focus:ring-kca-blue"
          />
        </div>

        {message && <p className="text-sm text-gray-500">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-kca-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kca-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
