import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, FileText, User, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { applicationApi } from '../../services/api'

export default function StudentDashboard() {
  const { user, studentProfile } = useAuth()
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

  const stats = [
    { label: 'Total Applications', value: applications.length, icon: FileText, color: 'bg-blue-500' },
    { label: 'Under Review', value: applications.filter((a) => a.status === 'under_review').length, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Accepted', value: applications.filter((a) => a.status === 'accepted').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Rejected', value: applications.filter((a) => a.status === 'rejected').length, icon: XCircle, color: 'bg-red-500' },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      shortlisted: 'bg-purple-100 text-purple-700',
      interview: 'bg-indigo-100 text-indigo-700',
      offer: 'bg-green-100 text-green-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
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
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {studentProfile?.fullName || user?.email}
          </h1>
          <p className="text-slate-600 mt-2">Here's an overview of your applications</p>
        </motion.div>

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
            to="/student/opportunities"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Briefcase className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Browse Opportunities</h3>
              <p className="text-sm text-slate-600">Find new placements</p>
            </div>
          </Link>
          <Link
            to="/student/profile"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <User className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">My Profile</h3>
              <p className="text-sm text-slate-600">Update your details</p>
            </div>
          </Link>
          <Link
            to="/student/applications"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">My Applications</h3>
              <p className="text-sm text-slate-600">Track your progress</p>
            </div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Recent Applications</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600">No applications yet</p>
              <Link
                to="/student/opportunities"
                className="inline-block mt-4 text-primary-600 font-medium hover:text-primary-700"
              >
                Browse opportunities
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {app.opportunityId?.title || 'Opportunity'}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {app.opportunityId?.organizationId?.legalName || 'Organization'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
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
