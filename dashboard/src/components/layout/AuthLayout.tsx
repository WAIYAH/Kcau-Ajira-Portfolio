import type { ReactNode } from 'react'
import Logo from '@/components/Logo'
import Card from '@/components/ui/Card'

// Points "Back to Home" at the public marketing site. Update this when
// the public site is deployed to its real production URL (mirrors
// DASHBOARD_URL in the public site's js/main.js, which points the other way).
const PUBLIC_SITE_URL = 'http://localhost:8080'

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <a
          href={PUBLIC_SITE_URL}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-primary"
        >
          <span aria-hidden="true">&larr;</span> Back to Home
        </a>

        <a href={PUBLIC_SITE_URL} className="mb-6 flex justify-center">
          <Logo size={40} />
        </a>

        <Card variant="raised" padding="lg">
          <h1 className="font-display text-xl font-bold text-fg">{title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  )
}
