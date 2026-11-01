import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import type { UserRole } from './types/domain'
const Layout = lazy(() => import('./components/Layout'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const StudentProfile = lazy(() => import('./pages/student/Profile'))
const StudentOpportunities = lazy(() => import('./pages/student/Opportunities'))
const StudentApplications = lazy(() => import('./pages/student/Applications'))
const OrganizationDashboard = lazy(() => import('./pages/organization/Dashboard'))
const OrganizationProfile = lazy(() => import('./pages/organization/Profile'))
const OrganizationOpportunities = lazy(() => import('./pages/organization/Opportunities'))
const OrganizationVerification = lazy(() => import('./pages/organization/Verification'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminOrganizations = lazy(() => import('./pages/admin/Organizations'))
const AdminActivity = lazy(() => import('./pages/admin/Activity'))
const AdminOpportunities = lazy(() => import('./pages/admin/Opportunities'))
const AdminApplications = lazy(() => import('./pages/admin/Applications'))
const NotFound = lazy(() => import('./pages/NotFound'))

const roleHome: Record<UserRole, string> = {
  student: '/student/dashboard',
  organization_representative: '/organization/dashboard',
  administrator: '/admin/dashboard',
}

function RoleRoute({ allowedRole }: { allowedRole: UserRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div role="status" className="p-12 text-center text-slate-500">Checking your session…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== allowedRole) return <Navigate to={roleHome[user.role]} replace />

  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading page…</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="student" element={<RoleRoute allowedRole="student" />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="opportunities" element={<StudentOpportunities />} />
              <Route path="applications" element={<StudentApplications />} />
            </Route>
            <Route path="organization" element={<RoleRoute allowedRole="organization_representative" />}>
              <Route path="dashboard" element={<OrganizationDashboard />} />
              <Route path="profile" element={<OrganizationProfile />} />
              <Route path="opportunities" element={<OrganizationOpportunities />} />
              <Route path="verification" element={<OrganizationVerification />} />
            </Route>
            <Route path="admin" element={<RoleRoute allowedRole="administrator" />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="organizations" element={<AdminOrganizations />} />
                <Route path="opportunities" element={<AdminOpportunities />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="activity" element={<AdminActivity />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
