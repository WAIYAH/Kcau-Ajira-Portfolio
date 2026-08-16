import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-3xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">This page doesn't exist.</p>
      <Link to="/" className="text-kca-blue hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
