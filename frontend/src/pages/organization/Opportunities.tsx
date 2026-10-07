import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Clock, CheckCircle, XCircle, Eye, Edit } from 'lucide-react'
import { opportunityApi } from '../../services/api'

export default function OrganizationOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fieldOfStudy: '',
    requiredSkills: '',
    academicRequirements: '',
    city: '',
    state: '',
    country: 'Nigeria',
    workArrangement: 'onsite',
    durationWeeks: '',
    availableSlots: '',
    applicationDeadline: '',
    requiredDocuments: '',
    additionalRequirements: '',
  })

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const response = await opportunityApi.listMy()
      setOpportunities(response.opportunities)
    } catch (error) {
      console.error('Failed to fetch opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await opportunityApi.create({
        title: formData.title,
        description: formData.description,
        fieldOfStudy: formData.fieldOfStudy,
        requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map((s) => s.trim()) : [],
        academicRequirements: formData.academicRequirements,
        location: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        workArrangement: formData.workArrangement,
        durationWeeks: parseInt(formData.durationWeeks),
        availableSlots: parseInt(formData.availableSlots),
        applicationDeadline: new Date(formData.applicationDeadline),
        requiredDocuments: formData.requiredDocuments ? formData.requiredDocuments.split(',').map((s) => s.trim()) : [],
        additionalRequirements: formData.additionalRequirements,
      })
      setShowCreateForm(false)
      fetchOpportunities()
    } catch (error) {
      console.error('Failed to create opportunity:', error)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string }> = {
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Opportunities</h1>
              <p className="text-slate-600 mt-2">Manage your SIWES postings</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              New Opportunity
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Opportunity</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
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
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        name="fieldOfStudy"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Duration (weeks)</label>
                      <input
                        type="number"
                        name="durationWeeks"
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Application Deadline</label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Create Draft
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
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                        <Eye size={16} />
                        View
                      </button>
                      {opp.status === 'draft' && (
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
                          <Edit size={16} />
                          Edit
                        </button>
                      )}
                    </div>
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
