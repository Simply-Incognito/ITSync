import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import StudentOpportunities from './pages/student/Opportunities'
import StudentApplications from './pages/student/Applications'
import OrganizationDashboard from './pages/organization/Dashboard'
import OrganizationProfile from './pages/organization/Profile'
import OrganizationOpportunities from './pages/organization/Opportunities'
import OrganizationVerification from './pages/organization/Verification'
import NotFound from './pages/NotFound'

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminOrganizations = lazy(() => import('./pages/admin/Organizations'))
const AdminActivity = lazy(() => import('./pages/admin/Activity'))
const AdminOpportunities = lazy(() => import('./pages/admin/Opportunities'))
const AdminApplications = lazy(() => import('./pages/admin/Applications'))

function AdminRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'administrator') {
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/organization/dashboard'} replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="student">
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="opportunities" element={<StudentOpportunities />} />
            <Route path="applications" element={<StudentApplications />} />
          </Route>
          <Route path="organization">
            <Route path="dashboard" element={<OrganizationDashboard />} />
            <Route path="profile" element={<OrganizationProfile />} />
            <Route path="opportunities" element={<OrganizationOpportunities />} />
            <Route path="verification" element={<OrganizationVerification />} />
          </Route>
          <Route
            path="admin"
            element={
              <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading administration tools…</div>}>
                <AdminRoute />
              </Suspense>
            }
          >
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
    </AuthProvider>
  )
}
