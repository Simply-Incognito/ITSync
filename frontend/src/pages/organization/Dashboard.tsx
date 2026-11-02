import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  FileText,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  Download,
} from 'lucide-react'
import { organizationApi, opportunityApi, applicationApi, studentDocumentApi } from '../../services/api'
import type { Application, ApplicationStatus, Opportunity, Organization } from '../../types/domain'
import { getOpportunityTitle, getStudentName } from '../../utils/display'
import { notify } from '../../lib/notify'

const applicationStatusDetails: Record<ApplicationStatus, { label: string; color: string; badge: string }> = {
  submitted: { label: 'Submitted', color: '#16a34a', badge: 'bg-emerald-100 text-emerald-800' },
  under_review: { label: 'Under review', color: '#eab308', badge: 'bg-amber-100 text-amber-800' },
  shortlisted: { label: 'Shortlisted', color: '#8b5cf6', badge: 'bg-violet-100 text-violet-800' },
  interview: { label: 'Interview', color: '#3b82f6', badge: 'bg-blue-100 text-blue-800' },
  offer: { label: 'Offer', color: '#06b6d4', badge: 'bg-cyan-100 text-cyan-800' },
  accepted: { label: 'Accepted', color: '#15803d', badge: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: '#ef4444', badge: 'bg-rose-100 text-rose-800' },
  withdrawn: { label: 'Withdrawn', color: '#64748b', badge: 'bg-slate-100 text-slate-700' },
}

const applicationStatusOrder: ApplicationStatus[] = [
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
  startOfThisWeek.setDate(today.getDate() - currentWeekday - 6 * 7)

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

export default function OrganizationDashboard() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const orgResponse = await organizationApi.getProfile()
      const currentOrganization = orgResponse.organization
      setOrganization(currentOrganization)

      const [opportunitiesResult, applicationsResult] = await Promise.allSettled([
        currentOrganization?.verificationStatus === 'verified'
          ? opportunityApi.listMy()
          : Promise.resolve({ opportunities: [] }),
        applicationApi.listForOrganization(),
      ])
      if (opportunitiesResult.status === 'fulfilled') {
        setOpportunities(opportunitiesResult.value.opportunities)
      } else {
        throw opportunitiesResult.reason
      }
      if (applicationsResult.status === 'fulfilled') {
        setApplications(applicationsResult.value.applications)
      } else {
        throw applicationsResult.reason
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to load organization data.')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'My opportunities', value: opportunities.length, icon: Briefcase, detail: 'All your postings' },
    { label: 'Total applications', value: applications.length, icon: FileText, detail: 'Received from students' },
    { label: 'Under review', value: applications.filter((application) => application.status === 'under_review').length, icon: Clock, detail: 'Awaiting a decision' },
    { label: 'Accepted', value: applications.filter((application) => application.status === 'accepted').length, icon: CheckCircle, detail: 'Successful applications' },
  ]
  const statusCounts = new Map<ApplicationStatus, number>()
  for (const application of applications) {
    statusCounts.set(application.status, (statusCounts.get(application.status) || 0) + 1)
  }
  const statusBreakdown = applicationStatusOrder
    .filter((status) => statusCounts.has(status))
    .map((status) => ({
      status,
      count: statusCounts.get(status) || 0,
      ...applicationStatusDetails[status],
    }))
  const statusTotal = statusBreakdown.reduce((total, item) => total + item.count, 0)
  let chartOffset = 0
  const statusChart = statusTotal
    ? `conic-gradient(${statusBreakdown.map((item) => {
        const start = chartOffset
        chartOffset += (item.count / statusTotal) * 100
        return `${item.color} ${start}% ${chartOffset}%`
      }).join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)'
  const applicationTrend = getApplicationTrend(applications)
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
  const verificationStatus = organization?.verificationStatus
  const verificationLabel = verificationStatus
    ? verificationStatus === 'pending'
      ? 'Verification under review'
      : verificationStatus === 'verified'
        ? 'Organization verified'
        : verificationStatus === 'suspended'
          ? 'Organization suspended'
          : verificationStatus === 'rejected'
            ? 'Verification needs attention'
            : 'Verification required'
    : 'Organization workspace'

  const downloadVerificationDocument = async (
    applicationId: string,
    documentId: string,
    fileName: string,
  ) => {
    setDownloadingDocumentId(documentId)
    try {
      const url = await studentDocumentApi.downloadForOrganization(applicationId, documentId)
      const link = window.document.createElement('a')
      link.href = url
      link.download = fileName
      link.rel = 'noreferrer'
      window.document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to download the document.')
    } finally {
      setDownloadingDocumentId('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status" aria-label="Loading organization dashboard" />
      </div>
    )
  }

  return (
    <div className="min-w-0 py-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex min-h-14 items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
              Hello, {organization?.legalName || 'there'}! <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Here’s what’s happening with your organization.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {organization?.verificationStatus === 'verified' && (
              <Link
                to="/organization/opportunities"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#245c49] px-3 text-xs font-semibold text-white transition hover:bg-[#174c39] sm:min-h-10 sm:px-4 sm:text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                <span className="hidden sm:inline">New Opportunity</span>
                <span className="sm:hidden">New</span>
              </Link>
            )}
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-medium text-emerald-800 sm:text-xs">
              <span
                className={`h-2 w-2 rounded-full ${verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{verificationLabel}</span>
              <span className="sm:hidden">{verificationStatus === 'verified' ? 'Verified' : 'Verification'}</span>
            </span>
          </div>
        </motion.div>

        {organization && organization.verificationStatus !== 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                {organization.verificationStatus === 'pending'
                  ? 'Your verification is under review'
                  : organization.verificationStatus === 'suspended'
                    ? 'Your organization is suspended'
                    : organization.verificationStatus === 'rejected'
                      ? 'Verification needs attention'
                      : 'Your account is active'}
              </h2>
              <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
                {organization.verificationStatus === 'pending'
                  ? 'You can continue using the portal while your documents are reviewed.'
                  : organization.verificationStatus === 'suspended'
                    ? 'Posting is unavailable while your organization is suspended. Please contact support for help.'
                    : 'Complete verification to unlock opportunity posting. You can continue using the portal in the meantime.'}
              </p>
            </div>
            <Link
              to="/organization/verification"
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white transition hover:bg-amber-700"
            >
              {organization.verificationStatus === 'pending' || organization.verificationStatus === 'suspended'
                ? 'View status'
                : 'Complete verification'}
            </Link>
          </motion.div>
        )}

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
              <p className="mt-3 text-2xl font-bold tracking-tight sm:mt-4 sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[10px] text-emerald-100/75 sm:text-xs">{stat.detail}</p>
            </motion.section>
          ))}
        </div>

        <div className="mb-4 grid gap-4 xl:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Application status</h2>
              <p className="mt-1 text-xs text-slate-500">A breakdown of applications to your opportunities</p>
            </div>
            {statusTotal === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-primary-700">
                  <FileText size={25} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-700">No application data yet</p>
                <p className="mt-1 text-xs text-slate-500">Applications will appear here when students apply.</p>
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
              <p className="mt-1 text-xs text-slate-500">Applications received over the last seven weeks</p>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-center gap-6 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{applications.length}</p>
                  <p className="text-[10px] text-slate-500">Total applications</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {Math.max(...applicationTrend.map((week) => week.count))}
                  </p>
                  <p className="text-[10px] text-slate-500">Peak in one week</p>
                </div>
              </div>
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-52 w-full sm:h-56"
                  role="img"
                  aria-label="Line chart of applications received over the last seven weeks"
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
                Applications received
              </div>
            </div>
          </section>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            to="/organization/opportunities"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md group sm:p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary-700 transition-colors group-hover:bg-emerald-100">
              <Briefcase size={19} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">My opportunities</h2>
              <p className="mt-0.5 text-xs text-slate-500">Manage your postings</p>
            </div>
          </Link>
          <Link
            to="/organization/profile"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md group sm:p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary-700 transition-colors group-hover:bg-emerald-100">
              <Building2 size={19} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Organization profile</h2>
              <p className="mt-0.5 text-xs text-slate-500">Update your details</p>
            </div>
          </Link>
          <Link
            to="/organization/verification"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md group sm:p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary-700 transition-colors group-hover:bg-emerald-100">
              <Eye size={19} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Verification</h2>
              <p className="mt-0.5 text-xs text-slate-500">View your organization status</p>
            </div>
          </Link>
        </div>

        <section id="applications" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent applications</h2>
              <p className="mt-1 text-xs text-slate-500">Latest applications from students</p>
            </div>
          </div>
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto text-slate-300" size={40} aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-600">No applications received yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app._id}
                  className="px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary-700">
                        <Users size={16} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {getStudentName(app.studentId)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                        {getOpportunityTitle(app.opportunityId)}
                        </p>
                      </div>
                    </div>
                    <span className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold sm:self-auto ${applicationStatusDetails[app.status].badge}`}>
                      {applicationStatusDetails[app.status].label}
                    </span>
                  </div>
                  {app.documents?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {app.documents.map((document) => (
                        <button
                          key={document._id}
                          type="button"
                          disabled={downloadingDocumentId === document._id}
                          onClick={() =>
                            void downloadVerificationDocument(
                              app._id,
                              document._id,
                              document.originalName,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Download size={14} />
                          {downloadingDocumentId === document._id
                            ? 'Downloading…'
                            : `${document.documentType === 'student_id' ? 'Student ID' : 'Biodata'} · ${document.originalName}`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      No verification document was attached to this application.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
    </div>
  )
}
