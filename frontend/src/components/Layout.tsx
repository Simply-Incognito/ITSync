import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'
import FeedbackWidget from './FeedbackWidget'
import AppToaster from './AppToaster'
import { WorkspaceNavigationProvider } from './WorkspaceNavigationContext'

export default function Layout() {
  const { isLoading } = useAuth()
  const { pathname } = useLocation()
  const isWorkspace = pathname.startsWith('/student/') || pathname.startsWith('/organization/')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <WorkspaceNavigationProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        {!isWorkspace && <Footer />}
        <FeedbackWidget />
        <AppToaster />
      </div>
    </WorkspaceNavigationProvider>
  )
}
