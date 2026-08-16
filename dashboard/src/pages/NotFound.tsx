import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
      <h1 className="font-display text-3xl font-bold text-fg">404</h1>
      <p className="text-fg-muted">This page doesn't exist.</p>
      <Link to="/" className="text-primary hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
