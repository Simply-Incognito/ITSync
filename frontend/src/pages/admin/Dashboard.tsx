import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
  growth: [],
};

const growthSeries = [
  { key: "students", label: "Students", color: "#0284c7" },
  { key: "organizations", label: "Organizations", color: "#7c3aed" },
  { key: "applications", label: "Applications", color: "#16a34a" },
  { key: "publishedOpportunities", label: "Published opportunities", color: "#ea580c" },
] as const;

type GrowthSeriesKey = (typeof growthSeries)[number]["key"];

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
  const [visibleDays, setVisibleDays] = useState(30);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<GrowthSeriesKey[]>(
    growthSeries.map(({ key }) => key),
  );
  const reduceMotion = useReducedMotion();
  const chartWidth = 640;
  const chartHeight = 260;
  const chartLeft = 44;
  const chartRight = 620;
  const chartTop = 22;
  const chartBottom = 202;
  const displayedGrowth = stats.growth.slice(-visibleDays);
  const activeDay =
    activeDayIndex === null ? null : displayedGrowth[activeDayIndex] ?? null;
  const maxDailyGrowth = Math.max(
    ...displayedGrowth.flatMap((day) =>
      growthSeries
        .filter(({ key }) => visibleSeries.includes(key))
        .map(({ key }) => day[key]),
    ),
    1,
  );
  const chartX = (index: number) =>
    chartLeft +
    (index * (chartRight - chartLeft)) / Math.max(displayedGrowth.length - 1, 1);
  const chartY = (value: number) =>
    chartBottom - (value / maxDailyGrowth) * (chartBottom - chartTop);

  const handleChartPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (displayedGrowth.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const chartPosition = ((event.clientX - bounds.left) / bounds.width) * chartWidth;
    const index = Math.round(
      ((chartPosition - chartLeft) / (chartRight - chartLeft)) *
        (displayedGrowth.length - 1),
    );
    setActiveDayIndex(Math.max(0, Math.min(displayedGrowth.length - 1, index)));
  };

  const handleChartKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = activeDayIndex ?? displayedGrowth.length - 1;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    setActiveDayIndex(
      Math.max(0, Math.min(displayedGrowth.length - 1, currentIndex + direction)),
    );
  };

  const toggleGrowthSeries = (key: GrowthSeriesKey) => {
    setVisibleSeries((current) =>
      current.includes(key)
        ? current.filter((visibleKey) => visibleKey !== key)
        : [...current, key],
    );
  };

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

      <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Platform growth</h3>
            <p className="mt-1 text-xs text-slate-500">
              Daily signups, applications, and opportunity publishing. Hover or focus the graph to inspect a day.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() =>
                setVisibleDays((days) => (days === 30 ? 14 : 7))
              }
              disabled={visibleDays === 7}
              aria-label="Zoom in on platform growth graph"
              title="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn size={16} aria-hidden="true" />
            </button>
            <span className="min-w-16 text-center text-xs font-medium text-slate-600">
              {visibleDays} days
            </span>
            <button
              type="button"
              onClick={() =>
                setVisibleDays((days) => (days === 7 ? 14 : 30))
              }
              disabled={visibleDays === 30}
              aria-label="Zoom out on platform growth graph"
              title="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setVisibleDays(30)}
              disabled={visibleDays === 30}
              aria-label="Reset platform growth graph zoom"
              title="Reset zoom"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mt-4 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="h-56 w-full touch-pan-y sm:h-64"
            role="group"
            aria-label={`Daily platform growth over the last ${visibleDays} days. Use left and right arrow keys to inspect dates.`}
            tabIndex={0}
            onPointerMove={handleChartPointerMove}
            onPointerLeave={() => setActiveDayIndex(null)}
            onKeyDown={handleChartKeyDown}
          >
            {[0, 1, 2, 3].map((line) => {
              const y = chartTop + (line * (chartBottom - chartTop)) / 3;
              const value = Math.ceil((maxDailyGrowth * (3 - line)) / 3);
              return (
                <g key={line}>
                  <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#e8eeea" strokeWidth="1" />
                  <text x="4" y={y + 4} fill="#64748b" fontSize="10">
                    {value}
                  </text>
                </g>
              );
            })}
            {growthSeries.map((series) => {
              const points = displayedGrowth.map(
                (day, index) => `${chartX(index)},${chartY(day[series.key])}`,
              );
              return (
                <g key={series.key}>
                  <title>{series.label}</title>
                  {visibleSeries.includes(series.key) && points.length > 1 && (
                    <motion.polyline
                      points={points.join(" ")}
                      fill="none"
                      stroke={series.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reduceMotion ? false : { pathLength: 0, opacity: 0.5 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
                    />
                  )}
                </g>
              );
            })}
            {displayedGrowth.map((day, index) => {
              const labelInterval = Math.max(1, Math.ceil(displayedGrowth.length / 6));
              if (index % labelInterval !== 0 && index !== displayedGrowth.length - 1) return null;
              const x = chartX(index);
              const date = new Date(`${day.date}T00:00:00Z`);
              return (
                <text
                  key={day.date}
                  x={x}
                  y="232"
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}
                </text>
              );
            })}
            {activeDay && activeDayIndex !== null && (
              <g pointerEvents="none">
              <line
                x1={chartX(activeDayIndex)}
                x2={chartX(activeDayIndex)}
                y1={chartTop}
                y2={chartBottom}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {growthSeries
                .filter(({ key }) => visibleSeries.includes(key))
                .map((series) => (
                  <circle
                    key={series.key}
                    cx={chartX(activeDayIndex)}
                    cy={chartY(activeDay[series.key])}
                    r="5"
                    fill="white"
                    stroke={series.color}
                    strokeWidth="3"
                  />
                ))}
              <g
                transform={`translate(${Math.max(
                  chartLeft,
                  Math.min(chartX(activeDayIndex) - 78, chartRight - 156),
                )}, ${chartTop + 8})`}
              >
                <rect
                  width="156"
                  height={30 + visibleSeries.length * 17}
                  rx="8"
                  fill="white"
                  stroke="#cbd5e1"
                  filter="drop-shadow(0 3px 6px rgb(15 23 42 / 0.12))"
                />
                <text x="10" y="18" fill="#334155" fontSize="10" fontWeight="600">
                  {new Date(`${activeDay.date}T00:00:00Z`).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                </text>
                {growthSeries
                  .filter(({ key }) => visibleSeries.includes(key))
                  .map((series, index) => (
                    <g key={series.key}>
                      <circle cx="14" cy={35 + index * 17} r="3" fill={series.color} />
                      <text x="22" y={38 + index * 17} fill="#475569" fontSize="9">
                        {series.label}
                      </text>
                      <text
                        x="146"
                        y={38 + index * 17}
                        fill="#0f172a"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="end"
                      >
                        {activeDay[series.key].toLocaleString()}
                      </text>
                    </g>
                  ))}
              </g>
              </g>
            )}
          </svg>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3">
          {growthSeries.map((series) => {
            const total = displayedGrowth.reduce((sum, day) => sum + day[series.key], 0);
            const isVisible = visibleSeries.includes(series.key);
            return (
              <button
              key={series.key}
              type="button"
              aria-pressed={isVisible}
              onClick={() => toggleGrowthSeries(series.key)}
              className={`flex items-center gap-2 rounded px-1 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isVisible ? "text-slate-600" : "text-slate-400 opacity-60"
              }`}
              >
              <span className="h-0.5 w-4" style={{ backgroundColor: series.color }} aria-hidden="true" />
              <span>{series.label}</span>
              <strong className="text-slate-900">{total.toLocaleString()}</strong>
              </button>
            );
          })}
        </div>
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
