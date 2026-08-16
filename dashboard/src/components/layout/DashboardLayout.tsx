import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNavDrawer from './MobileNavDrawer'
import Header from './Header'

const SIDEBAR_COLLAPSED_KEY = 'kca-sidebar-collapsed'

// No stored choice yet (first visit) -> default collapsed below the desktop
// breakpoint (1280px), matching the original responsive spec: expanded on
// desktop, collapsed-by-default on tablet. Once a user manually toggles it,
// that choice is persisted and wins from then on regardless of width.
function getInitialCollapsed(): boolean {
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
  if (stored !== null) return stored === '1'
  return typeof window !== 'undefined' && window.innerWidth < 1280
}

export default function DashboardLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Close the mobile drawer whenever navigation happens (link click, back/forward).
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-primary-solid focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
