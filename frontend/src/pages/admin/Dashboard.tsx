import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { administrationApi, type AdminOrganization, type AdminStats } from "../../services/api";
import { notify } from "../../lib/notify";

const emptyStats: AdminStats = {
  totalStudents: 0,
  totalOrganizations: 0,
  verifiedOrganizations: 0,
  pendingVerification: 0,
  totalApplications: 0,
  applicationsByStatus: {
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  },
  totalOpportunities: 0,
  publishedOpportunities: 0,
};

const cards = [
  {
    key: "totalStudents",
    label: "Students",
    icon: GraduationCap,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    key: "totalOrganizations",
    label: "Organizations",
    icon: Building2,
    tone: "bg-violet-100 text-violet-700",
  },
  {
    key: "verifiedOrganizations",
    label: "Verified organizations",
    icon: ShieldCheck,
    tone: "bg-primary-100 text-primary-700",
  },
  {
    key: "pendingVerification",
    label: "Awaiting review",
    icon: ClipboardList,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    key: "totalApplications",
    label: "Applications",
    icon: ClipboardList,
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "publishedOpportunities",
    label: "Published opportunities",
    icon: BriefcaseBusiness,
    tone: "bg-emerald-100 text-emerald-700",
  },
] as const;

const quickActions = [
  {
    to: "/admin/users",
    label: "Manage users",
    detail: "Browse student and organization accounts",
    icon: Users,
  },
  {
    to: "/admin/organizations?status=pending",
    label: "Review organizations",
    detail: "Verify newly submitted organizations",
    icon: Building2,
  },
  {
    to: "/admin/opportunities",
    label: "Review opportunities",
    detail: "Manage platform opportunity listings",
    icon: BriefcaseBusiness,
  },
  {
    to: "/admin/activity",
    label: "View activity",
    detail: "See recent administrative actions",
    icon: Activity,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      administrationApi.getStats(),
      administrationApi.listOrganizations({ status: "pending", limit: 5 }),
    ])
      .then(([statsResponse, organizationResponse]) => {
        if (!active) return;
        setStats(statsResponse.stats);
        setOrganizations(organizationResponse.organizations);
      })
      .catch((requestError) => {
        if (active)
          notify.error(
            requestError instanceof Error
              ? requestError.message
              : "Could not load dashboard data.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
          role="status"
          aria-label="Loading administration overview"
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 py-2 sm:space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
            Administration
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Platform overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor activity and keep the iSIWES community moving.
          </p>
        </div>
        <Link
          to="/admin/activity"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
        >
          Activity log <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </motion.header>

      <section
        aria-label="Platform statistics"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3"
      >
        {cards.map(({ key, label, icon: Icon, tone }, index) => (
          <motion.article
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                {label}
              </p>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {stats[key].toLocaleString()}
            </p>
          </motion.article>
        ))}
      </section>

      <section aria-labelledby="admin-quick-actions">
        <div className="mb-3">
          <h3 id="admin-quick-actions" className="text-lg font-semibold text-slate-900">
            Quick actions
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Jump straight into the areas you manage most.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ to, label, detail, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-28 items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md sm:p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 transition group-hover:bg-primary-200">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-slate-800">{label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  {detail}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-semibold text-slate-900">
              Organizations awaiting verification
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Review recently submitted organization profiles.
            </p>
          </div>
          <Link
            to="/admin/organizations?status=pending"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {organizations.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="mx-auto mb-2 text-primary-500" size={28} aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">
              All caught up
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No organizations are awaiting review.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {organizations.map((organization) => (
              <li
                key={organization._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50/80 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Building2 size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {organization.legalName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {formatDate(organization.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Pending review
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
