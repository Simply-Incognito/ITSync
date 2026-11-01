import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { administrationApi,
  type AdminOrganization,
  type AdminStats,
} from "../../services/api";
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
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Loading administration overview…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor activity and review platform organizations.
        </p>
      </div>

      <section
        aria-label="Platform statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cards.map(({ key, label, icon: Icon, tone }) => (
          <article
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {stats[key].toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {organizations.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No organizations are awaiting review.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {organizations.map((organization) => (
              <li
                key={organization._id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {organization.legalName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {formatDate(organization.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
