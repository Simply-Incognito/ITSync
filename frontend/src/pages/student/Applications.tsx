import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { applicationApi } from '../../services/api'

export default function StudentApplications() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen bg-slate-50 py-8">
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
                            {app.opportunityId?.title || 'Opportunity'}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {app.opportunityId?.organizationId?.legalName || 'Organization'}
                          </p>
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
    </div>
  )
}
