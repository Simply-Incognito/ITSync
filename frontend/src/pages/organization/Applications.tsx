import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { applicationApi } from '../../services/api'
import type { Application, ApplicationStatus } from '../../types/domain'
import { getOpportunityTitle, getStudentName } from '../../utils/display'
import { notify } from '../../lib/notify'

const pageSize = 20
const statuses: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

const nextStatuses: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['shortlisted', 'rejected', 'withdrawn'],
  shortlisted: ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  withdrawn: [],
}

function statusStyle(status: ApplicationStatus) {
  if (status === 'accepted' || status === 'offer')
    return 'bg-primary-100 text-primary-800'
  if (status === 'rejected') return 'bg-rose-100 text-rose-800'
  if (status === 'withdrawn') return 'bg-slate-100 text-slate-700'
  if (status === 'submitted') return 'bg-sky-100 text-sky-800'
  return 'bg-amber-100 text-amber-800'
}

export default function OrganizationApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, ApplicationStatus>
  >({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await applicationApi.listForOrganization({
        page,
        limit: pageSize,
        ...(status ? { status } : {}),
      })
      setApplications(response.applications)
      setTotal(response.pagination.total)
      setSelectedStatuses({})
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : 'Unable to load applications.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  const updateStatus = async (application: Application) => {
    const nextStatus = selectedStatuses[application._id]
    if (!nextStatus || !nextStatuses[application.status].includes(nextStatus))
      return

    let reason: string | undefined
    if (nextStatus === 'rejected') {
      reason = window.prompt('Reason for rejecting this application:')?.trim()
      if (!reason) return
      if (reason.length < 5) {
        notify.error('A rejection reason must be at least 5 characters.')
        return
      }
    } else if (
      !window.confirm(
        `Change this application from ${application.status.replace(/_/g, ' ')} to ${nextStatus.replace(/_/g, ' ')}?`,
      )
    ) {
      return
    }

    setUpdatingId(application._id)
    try {
      await applicationApi.updateStatus(application._id, {
        status: nextStatus,
        reason,
      })
      notify.success(
        `Application status updated to ${nextStatus.replace(/_/g, ' ')}.`,
      )
      await loadApplications()
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : 'Unable to update application status.',
      )
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <Link
              to="/organization/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-700"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review applicants for your opportunities and update their status.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {total.toLocaleString()} application{total === 1 ? '' : 's'}
          </p>
        </motion.header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            Filter by status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ApplicationStatus | '')
                setPage(1)
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal capitalize"
            >
              <option value="">All applications</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section
          aria-label="Organization applications"
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div
                className="h-9 w-9 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
                role="status"
                aria-label="Loading applications"
              />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList
                className="mx-auto mb-3 text-slate-300"
                size={38}
                aria-hidden="true"
              />
              <p className="font-medium text-slate-700">
                No applications found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {status
                  ? 'Try another status filter.'
                  : 'Applications for your opportunities will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((application) => {
                const options = nextStatuses[application.status]
                const selectedStatus = selectedStatuses[application._id] || ''

                return (
                  <article key={application._id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {getStudentName(application.studentId)}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {getOpportunityTitle(application.opportunityId)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Applied{' '}
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: 'medium',
                          }).format(new Date(application.createdAt))}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(application.status)}`}
                      >
                        {application.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {application.rejectionReason && (
                      <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                        Rejection reason: {application.rejectionReason}
                      </p>
                    )}

                    {options.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <label
                          className="sr-only"
                          htmlFor={`application-status-${application._id}`}
                        >
                          Next status for{' '}
                          {getStudentName(application.studentId)}
                        </label>
                        <select
                          id={`application-status-${application._id}`}
                          value={selectedStatus}
                          onChange={(event) =>
                            setSelectedStatuses((current) => ({
                              ...current,
                              [application._id]: event.target
                                .value as ApplicationStatus,
                            }))
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize"
                        >
                          <option value="">Choose next status</option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={
                            !selectedStatus || updatingId === application._id
                          }
                          onClick={() => void updateStatus(application)}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {updatingId === application._id
                            ? 'Saving…'
                            : 'Update status'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-40"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-40"
              >
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
