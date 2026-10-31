import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Clock, CheckCircle, XCircle, Edit, type LucideIcon } from 'lucide-react'
import { opportunityApi, organizationApi } from '../../services/api'
import type { Opportunity, OpportunityInput, WorkArrangement } from '../../types/domain'
import { getErrorMessage } from '../../utils/errors'
import { getOpportunityImageChoices } from '../../utils/opportunity-images'
import { notify } from '../../lib/notify'

interface OpportunityFormState {
  title: string
  description: string
  fieldOfStudy: string
  imageKey: string
  requiredSkills: string
  city: string
  state: string
  country: string
  workArrangement: WorkArrangement
  durationWeeks: string
  availableSlots: string
  applicationDeadline: string
  additionalRequirements: string
}

const emptyForm: OpportunityFormState = {
  title: '',
  description: '',
  fieldOfStudy: '',
  imageKey: '',
  requiredSkills: '',
  city: '',
  state: '',
  country: 'Nigeria',
  workArrangement: 'onsite',
  durationWeeks: '',
  availableSlots: '',
  applicationDeadline: '',
  additionalRequirements: '',
}

export default function OrganizationOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<OpportunityFormState>(emptyForm)
  const [organizationIndustry, setOrganizationIndustry] = useState('')

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const [response, organizationResponse] = await Promise.all([
        opportunityApi.listMy(),
        organizationApi.getProfile(),
      ])
      setOpportunities(response.opportunities)
      setOrganizationIndustry(organizationResponse.organization?.industry ?? '')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Unable to load opportunities.'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'workArrangement') {
      setFormData((current) => ({ ...current, workArrangement: value as WorkArrangement }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  const openCreateForm = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      imageKey: getOpportunityImageChoices(organizationIndustry)[0].id,
    })
    setShowCreateForm(true)
  }

  const openEditForm = (opportunity: Opportunity) => {
    setEditingId(opportunity._id)
    setFormData({
      title: opportunity.title,
      description: opportunity.description,
      fieldOfStudy: opportunity.fieldOfStudy,
      imageKey:
        opportunity.imageKey ?? getOpportunityImageChoices(organizationIndustry)[0].id,
      requiredSkills: (opportunity.requiredSkills || []).join(', '),
      city: opportunity.location.city,
      state: opportunity.location.state,
      country: opportunity.location.country,
      workArrangement: opportunity.workArrangement,
      durationWeeks: String(opportunity.durationWeeks),
      availableSlots: String(opportunity.availableSlots),
      applicationDeadline: new Date(opportunity.applicationDeadline).toISOString().slice(0, 10),
      additionalRequirements: opportunity.additionalRequirements || '',
    })
    setShowCreateForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const data: OpportunityInput = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      imageKey: formData.imageKey,
      requiredSkills: formData.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
      location: {
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      },
      workArrangement: formData.workArrangement,
      durationWeeks: Number(formData.durationWeeks),
      availableSlots: Number(formData.availableSlots),
      applicationDeadline: new Date(`${formData.applicationDeadline}T23:59:59`).toISOString(),
      additionalRequirements: formData.additionalRequirements.trim(),
    }

    try {
      if (editingId) await opportunityApi.update(editingId, data)
      else await opportunityApi.create(data)
      await fetchOpportunities()
      setShowCreateForm(false)
      setEditingId(null)
      notify.success(editingId ? 'Opportunity updated.' : 'Opportunity created as a draft.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to save opportunity.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitForReview = async (opportunityId: string) => {
    try {
      await opportunityApi.submit(opportunityId)
      await fetchOpportunities()
      notify.success('Opportunity submitted for review.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to submit opportunity for review.'))
    }
  }

  const handleCloseOpportunity = async (opportunityId: string) => {
    if (!window.confirm('Close this opportunity? Students will no longer be able to apply.')) return
    try {
      await opportunityApi.close(opportunityId)
      await fetchOpportunities()
      notify.success('Applications closed.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to close opportunity.'))
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
      draft: { icon: Edit, color: 'text-gray-600', bg: 'bg-gray-100' },
      pending_review: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      closed: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
      suspended: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    }
    return configs[status] || { icon: Briefcase, color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Opportunities</h1>
              <p className="text-slate-600 mt-2">Manage your SIWES postings</p>
            </div>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              New Opportunity
            </button>
          </div>

          {/* Create and edit form */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {editingId ? 'Edit Opportunity' : 'Create New Opportunity'}
                </h2>
                <p className="mb-6 text-sm text-slate-600">
                  {editingId
                    ? 'Update your draft or rejected posting before submitting it for review.'
                    : 'Save as a draft first. You can edit it before submitting it for review.'}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      minLength={3}
                      maxLength={160}
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      minLength={20}
                      maxLength={10000}
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Required skills</label>
                    <input
                      type="text"
                      name="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={handleChange}
                      placeholder="Separate skills with commas"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        name="fieldOfStudy"
                        minLength={2}
                        maxLength={160}
                        value={formData.fieldOfStudy}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Work Arrangement</label>
                      <select
                        name="workArrangement"
                        value={formData.workArrangement}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-slate-700">Opportunity image</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose a professionally designed image suggested for your {organizationIndustry || 'industry'}.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {getOpportunityImageChoices(organizationIndustry).map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          aria-pressed={formData.imageKey === choice.id}
                          onClick={() => setFormData((current) => ({ ...current, imageKey: choice.id }))}
                          className={`overflow-hidden rounded-xl border-2 text-left transition ${
                            formData.imageKey === choice.id
                              ? 'border-primary-500 ring-2 ring-primary-100'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={choice.src} alt="" className="h-20 w-full object-cover" />
                          <span className="block px-2.5 py-2 text-xs font-medium text-slate-700">
                            {choice.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Required applicant verification
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Every applicant must upload either a student ID or biodata as a PDF, JPEG, or PNG file (maximum 1 MB).
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Additional requirements</label>
                    <textarea
                      name="additionalRequirements"
                      maxLength={3000}
                      value={formData.additionalRequirements}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Duration (weeks)</label>
                      <input
                        type="number"
                        name="durationWeeks"
                        min={1}
                        max={104}
                        value={formData.durationWeeks}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                      <input
                        type="number"
                        name="availableSlots"
                        min={1}
                        max={10000}
                        value={formData.availableSlots}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Application Deadline</label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setEditingId(null)
                      }}
                      disabled={submitting}
                      className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Draft'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Opportunities List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600">No opportunities created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp, index) => {
                const config = getStatusConfig(opp.status)
                const StatusIcon = config.icon
                return (
                  <motion.div
                    key={opp._id}
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
                          <h3 className="font-semibold text-slate-800">{opp.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{opp.fieldOfStudy}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {opp.location?.city}, {opp.location?.state} • {opp.durationWeeks} weeks • {opp.availableSlots} slots
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {opp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      {(opp.status === 'draft' || opp.status === 'rejected') && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditForm(opp)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                          >
                          <Edit size={16} />
                          Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSubmitForReview(opp._id)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                          >
                            Submit for review
                          </button>
                        </>
                      )}
                      {opp.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => void handleCloseOpportunity(opp._id)}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          Close applications
                        </button>
                      )}
                    </div>
                    {opp.status === 'rejected' && opp.reviewNote && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-800">Admin feedback</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-red-700">{opp.reviewNote}</p>
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
