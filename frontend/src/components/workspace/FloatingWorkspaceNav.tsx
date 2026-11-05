import { LogOut, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export type WorkspaceNavItem = {
  to: string
  label: string
  icon: LucideIcon
}

type FloatingWorkspaceNavProps = {
  items: WorkspaceNavItem[]
  onLogout: () => void
}

export default function FloatingWorkspaceNav({
  items,
  onLogout,
}: FloatingWorkspaceNavProps) {
  return (
    <nav
      aria-label="Workspace navigation"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[92vw] max-w-md -translate-x-1/2 items-center justify-between gap-1 rounded-full border border-slate-200/70 bg-white/80 px-2 py-2 shadow-lg shadow-slate-900/10 backdrop-blur-xl lg:hidden"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          aria-label={label}
          title={label}
          className={({ isActive }) =>
            `flex h-11 min-w-0 flex-1 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-primary-100 text-primary-800 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon size={19} aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onLogout}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </nav>
  )
}
