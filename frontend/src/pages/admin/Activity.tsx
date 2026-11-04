import { useCallback, useEffect, useState } from 'react'
import { Activity as ActivityIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import { administrationApi, type AdminActivityEvent } from '../../services/api'
import { notify } from '../../lib/notify'

const pageSize = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminActivity() {
  const [activities, setActivities] = useState<AdminActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadActivity = useCallback(() => {
    let active = true
    setLoading(true)
    administrationApi
      .listActivity({ page, limit: pageSize })
      .then((response) => {
        if (active) {
          setActivities(response.activities)
          setTotal(response.pagination.total)
          setTotalPages(Math.max(1, response.pagination.totalPages))
        }
      })
      .catch((requestError: unknown) => {
        if (active)
          notify.error(
            requestError instanceof Error
              ? requestError.message
              : 'Could not load activity.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page])

  useEffect(() => loadActivity(), [loadActivity])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">
          Administration activity
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Account, organization, opportunity, and application review actions.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading activity…
          </p>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center">
            <ActivityIcon className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-medium text-slate-700">
              No activity recorded yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Administrative changes will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Administrator</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((log) => (
                  <tr key={log._id}>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">
                      {log.targetType} ·{' '}
                      <span className="font-mono text-xs">{log.targetId}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {log.actorUserId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td
                      className="max-w-xs truncate px-5 py-4 text-xs text-slate-500"
                      title={JSON.stringify(log.details)}
                    >
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-500">
              {total.toLocaleString()} total · Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
