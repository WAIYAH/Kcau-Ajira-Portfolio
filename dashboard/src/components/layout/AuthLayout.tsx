import type { ReactNode } from 'react'

// Points "Back to Home" at the public marketing site. Update this when
// the public site is deployed to its real production URL (mirrors
// DASHBOARD_URL in the public site's js/main.js, which points the other way).
const PUBLIC_SITE_URL = 'http://localhost:8080'

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <a
          href={PUBLIC_SITE_URL}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-kca-blue"
        >
          <span aria-hidden="true">&larr;</span> Back to Home
        </a>

        <a href={PUBLIC_SITE_URL} className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-kca-blue to-kca-teal text-white font-bold">
            KA
          </div>
          <div>
            <p className="text-sm font-bold text-kca-blue">KCA Ajira Club</p>
            <p className="text-xs text-gray-500">Member Dashboard</p>
          </div>
        </a>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
