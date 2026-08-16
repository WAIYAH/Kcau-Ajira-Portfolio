import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGate from './components/RoleGate'
import DashboardLayout from './components/layout/DashboardLayout'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import PendingApproval from './pages/auth/PendingApproval'

import Overview from './pages/Overview'
import Profile from './pages/Profile'
import Events from './pages/events/Events'
import Voting from './pages/voting/Voting'
import Learning from './pages/learning/Learning'
import MemberList from './pages/members/MemberList'
import Finance from './pages/finance/Finance'
import Communications from './pages/communications/Communications'
import Reports from './pages/reports/Reports'
import AuditLog from './pages/settings/AuditLog'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="/profile" element={<Profile />} />
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
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
