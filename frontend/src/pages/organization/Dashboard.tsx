import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, FileText, Users, Briefcase, Clock, CheckCircle, Plus, Eye, Download } from 'lucide-react'
import { organizationApi, opportunityApi, applicationApi, studentDocumentApi } from '../../services/api'
import type { Application, Opportunity, Organization } from '../../types/domain'
import { getOpportunityTitle, getStudentName } from '../../utils/display'

export default function OrganizationDashboard() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [documentError, setDocumentError] = useState('')
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
      console.error('Failed to fetch data:', error)
      setDataError(error instanceof Error ? error.message : 'Unable to load organization data.')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Open Opportunities', value: opportunities.length, icon: Briefcase, color: 'bg-sky-100', iconColor: 'text-sky-700' },
    { label: 'Total Applications', value: applications.length, icon: FileText, color: 'bg-violet-100', iconColor: 'text-violet-700' },
    { label: 'Under Review', value: applications.filter((a) => a.status === 'under_review').length, icon: Clock, color: 'bg-amber-100', iconColor: 'text-amber-700' },
    { label: 'Accepted', value: applications.filter((a) => a.status === 'accepted').length, icon: CheckCircle, color: 'bg-primary-100', iconColor: 'text-primary-700' },
  ]

  const downloadVerificationDocument = async (
    applicationId: string,
    documentId: string,
    fileName: string,
  ) => {
    setDownloadingDocumentId(documentId)
    setDocumentError('')
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
      console.error('Failed to download applicant verification document:', error)
      setDocumentError(error instanceof Error ? error.message : 'Unable to download the document.')
    } finally {
      setDownloadingDocumentId('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-8">
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

        {dataError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {dataError}
          </div>
        )}

        {/* Verification Status */}
        {organization && organization.verificationStatus !== 'verified' && (
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
                {organization.verificationStatus === 'pending'
                  ? 'View Verification Status'
                  : 'Complete Verification'}
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
                <stat.icon className={stat.iconColor} size={20} />
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
          {documentError && (
            <div role="alert" className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {documentError}
            </div>
          )}
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
                        {getStudentName(app.studentId)}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {getOpportunityTitle(app.opportunityId)}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {app.status.replace('_', ' ')}
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
        </div>
      </div>
    </div>
  )
}
