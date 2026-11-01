import {
  Activity,
  Building2,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/organizations", label: "Organizations", icon: Building2 },
  {
    to: "/admin/opportunities",
    label: "Opportunities",
    icon: BriefcaseBusiness,
  },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/activity", label: "Activity log", icon: Activity },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-9rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Platform control center
          </h1>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav
            aria-label="Administration"
            className="flex gap-2 overflow-x-auto lg:block lg:space-y-1"
          >
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition lg:flex ${
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
