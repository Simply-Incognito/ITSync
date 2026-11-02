import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useWorkspaceNavigation } from '../WorkspaceNavigationContext'

const navigation = [
  { to: '/organization/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organization/opportunities', label: 'Opportunities', icon: Briefcase, end: true },
  { to: '/organization/dashboard#applications', label: 'Applications', icon: FileText, end: true },
  { to: '/organization/profile', label: 'Settings & Profile', icon: User, end: true },
  { to: '/organization/verification', label: 'Verification', icon: ShieldCheck, end: true },
]

type OrganizationSidebarProps = {
  accountName: string
  onNavigate?: () => void
  onLogout: () => void
}

function OrganizationSidebar({ accountName, onNavigate, onLogout }: OrganizationSidebarProps) {
  const { hash } = useLocation()
  const initials = accountName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div className="flex min-h-full flex-col bg-[#245c49] text-white">
      <div className="px-4 pb-5 pt-6 sm:px-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[#174c39]">
            <Building2 size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">ITSync</p>
            <p className="text-[11px] text-emerald-100/75">Organization workspace</p>
          </div>
        </div>
      </div>

      <nav aria-label="Organization navigation" className="flex-1 space-y-2 px-3">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => {
              const isAnchorLink = to.includes('#')
              const isSelected = isActive && (isAnchorLink ? hash === '#applications' : hash !== '#applications')

              return `flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors duration-200 ${
                isSelected
                  ? 'bg-emerald-300 text-[#174c39] shadow-md shadow-emerald-950/10'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`
            }}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
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
  const { mobileMenuOpen, setMobileMenuOpen } = useWorkspaceNavigation()
  const accountName = user?.email || 'Organization representative'

  useEffect(() => {
    if (!mobileMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen, setMobileMenuOpen])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="workspace-layout min-h-[calc(100vh-4rem)] bg-slate-50 sm:min-h-[calc(100vh-4.5rem)]">
      <div className="grid min-h-[inherit] lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] self-start overflow-y-auto lg:block sm:top-[4.5rem] sm:h-[calc(100vh-4.5rem)]">
          <OrganizationSidebar accountName={accountName} onLogout={handleLogout} />
        </aside>

        <div className="min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-6 xl:px-8">
          <Outlet />
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-slate-950/45"
            aria-label="Close organization navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="organization-mobile-navigation"
            aria-label="Organization navigation"
            className="fixed bottom-0 left-0 top-16 z-[70] flex w-72 max-w-[85vw] flex-col overflow-y-auto rounded-r-2xl shadow-2xl"
          >
            <div className="flex items-center justify-end bg-[#245c49] px-3 pt-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label="Close organization navigation"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <OrganizationSidebar
              accountName={accountName}
              onNavigate={() => setMobileMenuOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
