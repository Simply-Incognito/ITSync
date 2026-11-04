import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Briefcase, FileText, GraduationCap, LayoutDashboard, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import FloatingWorkspaceNav from '../workspace/FloatingWorkspaceNav'

const navigation = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/student/applications', label: 'Applications', icon: FileText },
  { to: '/student/profile', label: 'Settings & Profile', icon: User },
]

type StudentSidebarProps = {
  fullName: string
  onLogout: () => void
}

function StudentSidebar({ fullName, onLogout }: StudentSidebarProps) {
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div className="flex min-h-full flex-col bg-[#245c49] text-white">
      <div className="px-4 pb-5 pt-6 sm:px-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[#174c39]">
            <GraduationCap size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">ITSync</p>
            <p className="text-[11px] text-emerald-100/75">Student workspace</p>
          </div>
        </div>
      </div>

      <nav aria-label="Student navigation" className="flex-1 space-y-2 px-3">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-emerald-300 text-[#174c39] shadow-md shadow-emerald-950/10'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-[#174c39]">
            {initials || 'S'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{fullName}</p>
            <p className="text-[11px] text-emerald-100/70">Student</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex min-h-10 w-full items-center gap-3 rounded-xl px-2 text-left text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[10px] text-emerald-100/80">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" aria-hidden="true" />
          <span>System is operational</span>
        </div>
      </div>
    </div>
  )
}

export default function StudentLayout() {
  const { user, studentProfile, logout } = useAuth()
  const navigate = useNavigate()
  const fullName = studentProfile?.fullName || user?.email || 'Student'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="workspace-layout min-h-[calc(100vh-4rem)] bg-slate-50 sm:min-h-[calc(100vh-4.5rem)]">
      <div className="grid min-h-[inherit] lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] self-start overflow-y-auto lg:block sm:top-[4.5rem] sm:h-[calc(100vh-4.5rem)]">
          <StudentSidebar fullName={fullName} onLogout={handleLogout} />
        </aside>

        <div className="min-w-0 px-3 py-4 pb-24 sm:px-5 sm:py-6 sm:pb-24 lg:px-6 lg:pb-6 xl:px-8">
          <Outlet />
        </div>
      </div>
      <FloatingWorkspaceNav items={navigation} onLogout={handleLogout} />
    </div>
  )
}
