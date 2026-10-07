import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, FileText, Users, Briefcase, Clock, CheckCircle, Plus, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { organizationApi, opportunityApi, applicationApi } from '../../services/api'

export default function OrganizationDashboard() {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [orgResponse, oppResponse, appResponse] = await Promise.all([
        organizationApi.getProfile(),
        opportunityApi.listMy(),
        applicationApi.listAll(),
      ])
      setOrganization(orgResponse.organization)
      setOpportunities(oppResponse.opportunities)
      setApplications(appResponse.applications)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Open Opportunities', value: opportunities.length, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Total Applications', value: applications.length, icon: FileText, color: 'bg-purple-500' },
    { label: 'Under Review', value: applications.filter((a) => a.status === 'under_review').length, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Accepted', value: applications.filter((a) => a.status === 'accepted').length, icon: CheckCircle, color: 'bg-green-500' },
  ]

  const getVerificationBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      draft: { text: 'Draft', color: 'bg-gray-100 text-gray-700' },
      pending: { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
      verified: { text: 'Verified', color: 'bg-green-100 text-green-700' },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-700' },
      suspended: { text: 'Suspended', color: 'bg-red-100 text-red-700' },
    }
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-700' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {organization?.legalName || 'Organization Dashboard'}
              </h1>
              <p className="text-slate-600 mt-2">Manage your opportunities and applications</p>
            </div>
            {organization?.verificationStatus === 'verified' && (
              <Link
                to="/organization/opportunities"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                New Opportunity
              </Link>
            )}
          </div>
        </motion.div>

        {/* Verification Status */}
        {organization?.verificationStatus !== 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">Verification Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {organization?.verificationStatus === 'pending'
                    ? 'Your organization is under review. You will be notified once verified.'
                    : 'Please complete verification to start posting opportunities.'}
                </p>
              </div>
              <Link
                to="/organization/verification"
                className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition-colors"
              >
                Complete Verification
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="text-white" size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/organization/opportunities"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Briefcase className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">My Opportunities</h3>
              <p className="text-sm text-slate-600">Manage postings</p>
            </div>
          </Link>
          <Link
            to="/organization/profile"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Building2 className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Organization Profile</h3>
              <p className="text-sm text-slate-600">Update details</p>
            </div>
          </Link>
          <Link
            to="/organization/verification"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Eye className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Verification</h3>
              <p className="text-sm text-slate-600">View status</p>
            </div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Recent Applications</h2>
          </div>
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600">No applications received yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {app.studentId?.fullName || 'Student'}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {app.opportunityId?.title || 'Opportunity'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
