import {
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import FloatingWorkspaceNav from '../workspace/FloatingWorkspaceNav'

const navigation = [
  { to: '/organization/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/organization/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/organization/applications', label: 'Applications', icon: FileText },
  { to: '/organization/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/organization/profile', label: 'Profile', icon: Building2 },
]

function OrganizationSidebar({
  accountName,
  onLogout,
}: {
  accountName: string
  onLogout: () => void
}) {
  const initials = accountName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div className="flex min-h-full flex-col bg-[#245c49] text-white">
      <div className="px-4 pb-5 pt-6 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[#174c39]">
            <Building2 size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">ITSync</p>
            <p className="text-[11px] text-emerald-100/75">Organization workspace</p>
          </div>
        </div>
      </div>

      <nav aria-label="Organization navigation" className="flex-1 space-y-2 px-3">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors duration-200 ${
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

      <div className="mt-4 border-t border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-[#174c39]">
            {initials || 'O'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{accountName}</p>
            <p className="text-[11px] text-emerald-100/70">Organization representative</p>
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

export default function OrganizationLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const accountName = user?.email || 'Organization representative'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 sm:min-h-[calc(100vh-4.5rem)]">
      <div className="mx-auto max-w-[96rem] px-3 py-4 sm:px-5 sm:py-6 lg:px-6 xl:px-8">
        <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-6">
          <aside className="hidden overflow-hidden rounded-2xl shadow-sm lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <OrganizationSidebar accountName={accountName} onLogout={handleLogout} />
          </aside>
          <main className="min-w-0 pb-24 lg:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
      <FloatingWorkspaceNav items={navigation} onLogout={handleLogout} />
    </div>
  )
}
