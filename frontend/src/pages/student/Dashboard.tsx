import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
} from 'lucide-react'
import type { Application, ApplicationStatus } from '../../types/domain'
import { useAuth } from '../../context/AuthContext'
import { applicationApi } from '../../services/api'

const statusDetails: Record<ApplicationStatus, { label: string; color: string; badge: string }> = {
  submitted: { label: 'Submitted', color: '#16a34a', badge: 'bg-emerald-100 text-emerald-800' },
  under_review: { label: 'Under review', color: '#eab308', badge: 'bg-amber-100 text-amber-800' },
  shortlisted: { label: 'Shortlisted', color: '#8b5cf6', badge: 'bg-violet-100 text-violet-800' },
  interview: { label: 'Interview', color: '#3b82f6', badge: 'bg-blue-100 text-blue-800' },
  offer: { label: 'Offer', color: '#06b6d4', badge: 'bg-cyan-100 text-cyan-800' },
  accepted: { label: 'Accepted', color: '#15803d', badge: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: '#ef4444', badge: 'bg-rose-100 text-rose-800' },
  withdrawn: { label: 'Withdrawn', color: '#64748b', badge: 'bg-slate-100 text-slate-700' },
}

const statusOrder: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

function getApplicationTrend(applications: Application[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentWeekday = (today.getDay() + 6) % 7
  const startOfThisWeek = new Date(today)
  startOfThisWeek.setDate(today.getDate() - currentWeekday)
  startOfThisWeek.setDate(startOfThisWeek.getDate() - 6 * 7)

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(startOfThisWeek)
    start.setDate(startOfThisWeek.getDate() + index * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const count = applications.filter((application) => {
      const createdAt = new Date(application.createdAt)
      return createdAt >= start && createdAt < end
    }).length

    return {
      label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    }
  })
}

function getApplicationStatus(applications: Application[]) {
  const counts = new Map<ApplicationStatus, number>()
  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) || 0) + 1)
  }
  return statusOrder
    .filter((status) => counts.has(status))
    .map((status) => ({ status, count: counts.get(status) || 0, ...statusDetails[status] }))
}

export default function StudentDashboard() {
  const { user, studentProfile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const fullName = studentProfile?.fullName || user?.email || 'Student'

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await applicationApi.listMy()
      setApplications(response.applications)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Total applications', value: applications.length, icon: FileText, detail: 'All submitted applications' },
    { label: 'Under review', value: applications.filter((application) => application.status === 'under_review').length, icon: Clock, detail: 'Awaiting a decision' },
    { label: 'Accepted', value: applications.filter((application) => application.status === 'accepted').length, icon: CheckCircle, detail: 'Successful applications' },
    { label: 'Rejected', value: applications.filter((application) => application.status === 'rejected').length, icon: XCircle, detail: 'Applications not selected' },
  ]
  const statusBreakdown = getApplicationStatus(applications)
  const applicationTrend = getApplicationTrend(applications)
  const statusTotal = statusBreakdown.reduce((total, item) => total + item.count, 0)
  let chartOffset = 0
  const statusChart = statusTotal
    ? `conic-gradient(${statusBreakdown.map((item) => {
        const start = chartOffset
        chartOffset += (item.count / statusTotal) * 100
        return `${item.color} ${start}% ${chartOffset}%`
      }).join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)'

  const chartWidth = 640
  const chartHeight = 250
  const chartLeft = 44
  const chartRight = 620
  const chartTop = 22
  const chartBottom = 195
  const maxWeeklyApplications = Math.max(...applicationTrend.map((week) => week.count), 1)
  const trendPoints = applicationTrend.map((week, index) => ({
    x: chartLeft + (index * (chartRight - chartLeft)) / (applicationTrend.length - 1),
    y: chartBottom - (week.count / maxWeeklyApplications) * (chartBottom - chartTop),
  }))
  const trendLine = trendPoints.map((point) => `${point.x},${point.y}`).join(' ')

  const getStatusBadge = (status: ApplicationStatus) => statusDetails[status]?.badge || 'bg-slate-100 text-slate-700'

  return (
    <div className="min-w-0 py-2">
            <header className="mb-5 flex min-h-14 items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                    Hello, {fullName}! <span aria-hidden="true">👋</span>
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">What are you looking for today?</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-medium text-emerald-800 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Application tracking
              </span>
            </header>

            <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.section
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="min-h-28 rounded-xl bg-[#245c49] p-4 text-white shadow-md shadow-emerald-950/10 sm:min-h-32 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-50 sm:text-xs">
                      {stat.label}
                    </p>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-100">
                      <stat.icon size={15} aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight sm:mt-4 sm:text-3xl">
                    {loading ? '—' : stat.value}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-100/75 sm:text-xs">{stat.detail}</p>
                </motion.section>
              ))}
            </div>

            <div className="mb-4 grid gap-4 xl:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Application status</h2>
                  <p className="mt-1 text-xs text-slate-500">A breakdown of your application progress</p>
                </div>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status" aria-label="Loading application status" />
                  </div>
                ) : statusTotal === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-primary-700">
                      <FileText size={25} aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-700">No application data yet</p>
                    <Link to="/student/opportunities" className="mt-1 text-xs font-medium text-primary-700 hover:underline">
                      Explore opportunities
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex min-h-64 flex-col items-center justify-center py-5">
                      <p className="text-2xl font-bold text-slate-900">{statusTotal}</p>
                      <p className="text-[11px] text-slate-500">Total applications</p>
                      <div
                        role="img"
                        aria-label={`Application status chart showing ${statusTotal} applications`}
                        className="relative mt-3 h-40 w-40 rounded-full sm:h-44 sm:w-44"
                        style={{ background: statusChart }}
                      >
                        <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-white">
                          <span className="text-2xl font-bold text-slate-900">{statusTotal}</span>
                          <span className="text-[9px] text-slate-500">applications</span>
                        </div>
                      </div>
                    </div>
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
                      {statusBreakdown.map((item) => (
                        <li key={item.status} className="flex items-center gap-1.5 text-[10px] text-slate-600 sm:text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                          {item.label} ({item.count})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Application activity</h2>
                  <p className="mt-1 text-xs text-slate-500">Applications submitted over the last seven weeks</p>
                </div>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status" aria-label="Loading application activity" />
                  </div>
                ) : (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-center gap-6 text-center">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{applications.length}</p>
                        <p className="text-[10px] text-slate-500">Total applications</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">{Math.max(...applicationTrend.map((week) => week.count))}</p>
                        <p className="text-[10px] text-slate-500">Peak in one week</p>
                      </div>
                    </div>
                    <div className="w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="h-52 w-full sm:h-56"
                        role="img"
                        aria-label="Line chart of applications submitted over the last seven weeks"
                      >
                        {[0, 1, 2, 3].map((line) => {
                          const y = chartTop + (line * (chartBottom - chartTop)) / 3
                          return (
                            <g key={line}>
                              <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#e8eeea" strokeWidth="1" />
                              <text x="4" y={y + 4} fill="#64748b" fontSize="10">
                                {Math.ceil((maxWeeklyApplications * (3 - line)) / 3)}
                              </text>
                            </g>
                          )
                        })}
                        {trendPoints.length > 1 && (
                          <polyline
                            points={trendLine}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        {trendPoints.map((point, index) => (
                          <g key={applicationTrend[index].label}>
                            <circle cx={point.x} cy={point.y} r="4" fill="#16a34a" />
                            <text x={point.x} y="222" fill="#64748b" fontSize="9" textAnchor="middle">
                              {applicationTrend[index].label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-700 sm:text-xs">
                      <span className="h-0.5 w-4 bg-emerald-600" aria-hidden="true" />
                      Applications submitted
                    </div>
                  </div>
                )}
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent applications</h2>
                  <p className="mt-1 text-xs text-slate-500">Your latest placement applications</p>
                </div>
                <Link
                  to="/student/applications"
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  View all
                </Link>
              </div>
              {loading ? (
                <div className="p-10 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status" aria-label="Loading applications" />
                </div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-600">You haven’t applied to any opportunities yet.</p>
                  <Link to="/student/opportunities" className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline">
                    Browse opportunities
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.slice(0, 5).map((application) => {
                    const opportunity = typeof application.opportunityId === 'string'
                      ? undefined
                      : application.opportunityId
                    const organization = typeof opportunity?.organizationId === 'string'
                      ? undefined
                      : opportunity?.organizationId

                    return (
                      <div
                        key={application._id}
                        className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary-700">
                            <Briefcase size={16} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {opportunity?.title || 'Opportunity'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {organization?.legalName || 'Organization'} · Applied {new Date(application.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold sm:self-auto ${getStatusBadge(application.status)}`}>
                          {statusDetails[application.status]?.label || application.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
    </div>
  )
}
