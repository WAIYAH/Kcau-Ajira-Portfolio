import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// React error boundaries must be class components -- there's no hook
// equivalent. Without this, an unhandled render-time exception anywhere in
// the app previously just blanked the screen with no feedback and no way
// to recover short of a manual refresh.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger-ink">
            <AlertTriangle size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-fg">Something went wrong</h1>
            <p className="mt-1 max-w-sm text-sm text-fg-muted">
              An unexpected error occurred. Reloading usually fixes it — if it keeps happening, let a club admin know.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      )
    }

    return this.props.children
  }
}
