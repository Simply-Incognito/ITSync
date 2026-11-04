import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, XCircle, Eye, X } from 'lucide-react'
import { applicationApi } from '../../services/api'
import type { Application, OrganizationSummary } from '../../types/domain'
import { notify } from '../../lib/notify'

export default function StudentApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationToView, setOrganizationToView] = useState<OrganizationSummary | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await applicationApi.listMy()
      setApplications(response.applications)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to load your applications.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string }> = {
      submitted: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
      under_review: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      shortlisted: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
      interview: { icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      offer: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      withdrawn: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
    }
    return configs[status] || { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Applications</h1>
          <p className="text-slate-600 mb-8">Track the status of your applications</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600">You haven't applied to any opportunities yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, index) => {
                const config = getStatusConfig(app.status)
                const StatusIcon = config.icon
                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center`}>
                          <StatusIcon className={config.color} size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {typeof app.opportunityId === 'string' ? 'Opportunity' : app.opportunityId.title}
                          </h3>
                          {typeof app.opportunityId !== 'string' && (() => {
                            const organization = app.opportunityId.organizationId
                            if (!organization || typeof organization === 'string') {
                              return <p className="mt-1 text-sm text-slate-600">Organization</p>
                            }
                            const name = organization.tradingName || organization.legalName || 'Organization'
                            const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
                            return (
                              <button
                                type="button"
                                onClick={() => setOrganizationToView(organization)}
                                className="mt-1 inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800"
                                aria-label={`View ${name} profile`}
                              >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{initials || 'O'}</span>
                                {name} <span className="text-xs text-slate-500">(view profile)</span>
                              </button>
                            )
                          })()}
                          <p className="text-xs text-slate-500 mt-2">
                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    {app.rejectionReason && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl">
                        <p className="text-sm text-red-700">{app.rejectionReason}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
      {organizationToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="organization-profile-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="organization-profile-title" className="text-xl font-bold text-slate-900">{organizationToView.tradingName || organizationToView.legalName}</h2>
                <p className="mt-1 text-sm text-slate-500">Organization profile · read-only</p>
              </div>
              <button type="button" aria-label="Close organization profile" onClick={() => setOrganizationToView(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <dl className="mt-5 grid gap-4 text-sm">
              <div><dt className="font-medium text-slate-500">Legal name</dt><dd className="mt-1 text-slate-800">{organizationToView.legalName}</dd></div>
              <div><dt className="font-medium text-slate-500">Industry</dt><dd className="mt-1 text-slate-800">{organizationToView.industry || 'Not provided'}</dd></div>
              <div><dt className="font-medium text-slate-500">About</dt><dd className="mt-1 whitespace-pre-line text-slate-800">{organizationToView.description || 'Not provided'}</dd></div>
              <div><dt className="font-medium text-slate-500">Representative</dt><dd className="mt-1 text-slate-800">{organizationToView.representativeName || 'Not provided'}{organizationToView.representativeTitle ? ` · ${organizationToView.representativeTitle}` : ''}</dd></div>
              <div><dt className="font-medium text-slate-500">Address</dt><dd className="mt-1 text-slate-800">{organizationToView.address ? [organizationToView.address.street, organizationToView.address.city, organizationToView.address.state, organizationToView.address.country].filter(Boolean).join(', ') : 'Not provided'}</dd></div>
              {organizationToView.website && (
                <div><dt className="font-medium text-slate-500">Website</dt><dd className="mt-1"><a href={organizationToView.website} target="_blank" rel="noreferrer" className="text-primary-700 underline">{organizationToView.website}</a></dd></div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
