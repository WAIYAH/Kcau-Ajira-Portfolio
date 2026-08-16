import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const memberLinks = [
  { to: '/', label: 'Overview', end: true },
  { to: '/profile', label: 'My Profile' },
  { to: '/events', label: 'Events' },
  { to: '/voting', label: 'Voting' },
  { to: '/learning', label: 'Learning Hub' },
]

const staffLinks = [
  { to: '/members', label: 'Members' },
  { to: '/finance', label: 'Finance' },
  { to: '/communications', label: 'Communications' },
  { to: '/reports', label: 'Reports' },
]

const adminLinks = [{ to: '/settings/audit-log', label: 'Audit Log' }]

export default function DashboardLayout() {
  const { profile, isStaff, isAdmin, signOut } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-kca-blue text-white' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-kca-blue focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } w-full border-b border-gray-200 bg-white p-4 md:block md:w-64 md:border-b-0 md:border-r md:p-6`}
      >
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-kca-blue to-kca-teal text-white font-bold">
            KA
          </div>
          <div>
            <p className="text-sm font-bold text-kca-blue">KCA Ajira Club</p>
            <p className="text-xs text-gray-500">Member Dashboard</p>
          </div>
        </div>

        <nav className="space-y-1" aria-label="Main navigation">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Member</p>
          {memberLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClasses}>
              {link.label}
            </NavLink>
          ))}

          {isStaff && (
            <>
              <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Leadership</p>
              {staffLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClasses}>
                  {link.label}
                </NavLink>
              ))}
            </>
          )}

          {isAdmin && (
            <>
              <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Admin</p>
              {adminLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClasses}>
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="truncate text-sm font-medium text-gray-800">{profile?.full_name}</p>
          <p className="truncate text-xs capitalize text-gray-500">{profile?.role}</p>
          <button
            onClick={() => signOut()}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <p className="text-sm font-bold text-kca-blue">KCA Ajira Club</p>
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            Menu
          </button>
        </header>

        <main id="main-content" className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
