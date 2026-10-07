import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import StudentOpportunities from './pages/student/Opportunities'
import StudentApplications from './pages/student/Applications'
import OrganizationDashboard from './pages/organization/Dashboard'
import OrganizationProfile from './pages/organization/Profile'
import OrganizationOpportunities from './pages/organization/Opportunities'
import OrganizationVerification from './pages/organization/Verification'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
