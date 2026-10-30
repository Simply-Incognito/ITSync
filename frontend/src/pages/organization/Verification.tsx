import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Upload,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { organizationApi } from '../../services/api'

type VerificationStatus = 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended'
type OrganizationDocumentType =
  | 'cac_certificate'
  | 'representative_authorization'
  | 'proof_of_address'

type VerificationOrganization = {
  verificationStatus: VerificationStatus
  rejectionReason?: string | null
}

type VerificationDocument = {
  documentType: OrganizationDocumentType
  originalName: string
}

const requiredDocumentTypes: OrganizationDocumentType[] = [
  'cac_certificate',
  'representative_authorization',
  'proof_of_address',
]

export default function OrganizationVerification() {
  const [organization, setOrganization] = useState<VerificationOrganization | null>(null)
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [loadError, setLoadError] = useState('')
  const [uploadingType, setUploadingType] = useState<OrganizationDocumentType | null>(null)
  const cacCertificateRef = useRef<HTMLInputElement>(null)
  const representativeAuthRef = useRef<HTMLInputElement>(null)
  const proofOfAddressRef = useRef<HTMLInputElement>(null)

  const fileInputRefs: Record<OrganizationDocumentType, React.RefObject<HTMLInputElement | null>> = {
    cac_certificate: cacCertificateRef,
    representative_authorization: representativeAuthRef,
    proof_of_address: proofOfAddressRef,
  }

  useEffect(() => {
    void fetchVerificationStatus()
  }, [])

  const fetchVerificationStatus = async () => {
    try {
      const response = await organizationApi.getProfile()
      setOrganization(response.organization as VerificationOrganization | null)
      setDocuments((response.documents || []) as VerificationDocument[])
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load verification status.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: OrganizationDocumentType,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingType(docType)
    setMessage('')

    try {
      await organizationApi.uploadDocument(file, docType)
      setMessage('Document uploaded successfully!')
      setMessageType('success')
      await fetchVerificationStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to upload document.')
      setMessageType('error')
    } finally {
      setUploadingType(null)
      const ref = fileInputRefs[docType]
      if (ref?.current) {
        ref.current.value = ''
      }
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setMessage('')

    try {
      await organizationApi.submitForVerification()
      setMessage('Organization submitted for verification successfully!')
      setMessageType('success')
      await fetchVerificationStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit for verification.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusConfig = (status: VerificationStatus) => {
    const configs: Record<VerificationStatus, {
      icon: LucideIcon,
      color: string,
      bg: string,
      title: string,
      description: string,
    }> = {
      draft: {
        icon: Clock,
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        title: 'Draft',
        description:
          'Your organization profile is still in draft status. Please complete all required information and submit for verification.',
      },
      pending: {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        title: 'Pending Review',
        description:
          'Your organization is currently under review by our team. This process typically takes 1-3 business days.',
      },
      verified: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        title: 'Verified',
        description:
          'Congratulations! Your organization has been verified and can now post SIWES opportunities.',
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        title: 'Rejected',
        description:
          'Your organization verification was rejected. Please review the reason and resubmit.',
      },
      suspended: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        title: 'Suspended',
        description:
          'Your organization has been suspended. Please contact support for more information.',
      },
    }
    return configs[status] || configs.draft
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Organization Verification</h1>
            <p className="text-slate-600 mb-8">Complete verification to start posting opportunities</p>

            {loadError ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {loadError}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="text-yellow-600" size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Organization Profile Required</h2>
                    <p className="text-slate-600 mt-2">
                      You need to create your organization profile before you can upload verification documents.
                      Please complete your organization profile first.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <a
                    href="/organization/profile"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    Create Organization Profile
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(organization?.verificationStatus || 'draft')
  const StatusIcon = statusConfig.icon
  const isVerified = organization?.verificationStatus === 'verified'

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Organization Verification</h1>
          <p className="text-slate-600 mb-8">
            {isVerified
              ? 'Your organization is verified and can post opportunities.'
              : 'Complete verification to start posting opportunities'}
          </p>

          {message && (
            <div
              role={messageType === 'error' ? 'alert' : 'status'}
              className={`mb-6 rounded-xl border p-4 ${
                messageType === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 ${statusConfig.bg} rounded-2xl flex items-center justify-center`}>
                <StatusIcon className={statusConfig.color} size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{statusConfig.title}</h2>
                <p className="text-slate-600 mt-2">{statusConfig.description}</p>
              </div>
            </div>

            {organization?.verificationStatus === 'rejected' && organization?.rejectionReason && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-red-800">Rejection Reason</h3>
                    <p className="text-red-700 mt-1">{organization.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Required Documents */}
            {!isVerified && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-primary-600" />
                  Required Documents
                </h2>
                <p className="text-slate-600 mb-6">
                  Please upload the following documents to complete your verification:
                </p>
                <div className="space-y-4">
                  {requiredDocumentTypes.map((docType) => {
                      const uploaded = documents.find((d) => d.documentType === docType)
                      return (
                        <div
                          key={docType}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {uploaded ? (
                              <CheckCircle className="text-green-500" size={24} />
                            ) : (
                              <Upload className="text-slate-400" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">
                              {docType === 'cac_certificate'
                                ? 'CAC Certificate'
                                : docType === 'representative_authorization'
                                  ? 'Representative Authorization'
                                  : 'Proof of Address'
                              }
                            </p>
                            {uploaded && (
                              <p className="text-sm text-slate-500">{uploaded.originalName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {uploaded ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Uploaded
                              </span>
                            ) : (
                              <>
                                <input
                                  ref={fileInputRefs[docType]}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileSelect(e, docType)}
                                  className="hidden"
                                  disabled={uploadingType !== null}
                                />
                                <button
                                  onClick={() => {
                                    fileInputRefs[docType]?.current?.click()
                                  }}
                                  disabled={uploadingType !== null}
                                  className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                  {uploadingType === docType ? 'Uploading...' : 'Upload'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            {organization?.verificationStatus === 'draft' || organization?.verificationStatus === 'rejected' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Shield size={20} />
                    Submit for Verification
                  </>
                )}
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  )
}