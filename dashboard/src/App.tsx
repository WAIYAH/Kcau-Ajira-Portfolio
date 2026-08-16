import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGate from './components/RoleGate'
import DashboardLayout from './components/layout/DashboardLayout'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import PendingApproval from './pages/auth/PendingApproval'
import NotFound from './pages/NotFound'

// Every route below only loads once a member is signed in and lands past
// the auth screens, so splitting them out of the initial bundle (which
// otherwise ships recharts, every table/form page, etc. up front) shrinks
// what has to download before someone can even see the login screen.
const Overview = lazy(() => import('./pages/Overview'))
const Profile = lazy(() => import('./pages/Profile'))
const Opportunities = lazy(() => import('./pages/opportunities/Opportunities'))
const Events = lazy(() => import('./pages/events/Events'))
const Voting = lazy(() => import('./pages/voting/Voting'))
const Learning = lazy(() => import('./pages/learning/Learning'))
const MemberList = lazy(() => import('./pages/members/MemberList'))
const Finance = lazy(() => import('./pages/finance/Finance'))
const Communications = lazy(() => import('./pages/communications/Communications'))
const Reports = lazy(() => import('./pages/reports/Reports'))
const AuditLog = lazy(() => import('./pages/settings/AuditLog'))
const UiKit = lazy(() => import('./pages/dev/UiKit'))

function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-fg-muted">
      <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pending-approval" element={<PendingApproval />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/opportunities" element={<Opportunities />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/voting" element={<Voting />} />
                    <Route path="/learning" element={<Learning />} />

                    <Route
                      path="/members"
                      element={
                        <RoleGate staffOnly>
                          <MemberList />
                        </RoleGate>
                      }
                    />
                    <Route
                      path="/finance/*"
                      element={
                        <RoleGate staffOnly>
                          <Finance />
                        </RoleGate>
                      }
                    />
                    <Route
                      path="/communications/*"
                      element={
                        <RoleGate staffOnly>
                          <Communications />
                        </RoleGate>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <RoleGate staffOnly>
                          <Reports />
                        </RoleGate>
                      }
                    />
                    <Route
                      path="/settings/audit-log"
                      element={
                        <RoleGate adminOnly>
                          <AuditLog />
                        </RoleGate>
                      }
                    />
                    <Route
                      path="/dev/ui-kit"
                      element={
                        <RoleGate adminOnly>
                          <UiKit />
                        </RoleGate>
                      }
                    />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </MotionConfig>
  )
}
