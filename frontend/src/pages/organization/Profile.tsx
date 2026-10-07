import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, User, Save } from 'lucide-react'
import { organizationApi } from '../../services/api'

export default function OrganizationProfile() {
  const [organization, setOrganization] = useState<any>(null)
  const [formData, setFormData] = useState({
    legalName: '',
    tradingName: '',
    industry: '',
    description: '',
    website: '',
    representativeName: '',
    representativeTitle: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await organizationApi.getProfile()
      setOrganization(response.organization)
      setFormData({
        legalName: response.organization.legalName || '',
        tradingName: response.organization.tradingName || '',
        industry: response.organization.industry || '',
        description: response.organization.description || '',
        website: response.organization.website || '',
        representativeName: response.organization.representativeName || '',
        representativeTitle: response.organization.representativeTitle || '',
        street: response.organization.address?.street || '',
        city: response.organization.address?.city || '',
        state: response.organization.address?.state || '',
        country: response.organization.address?.country || 'Nigeria',
        postalCode: response.organization.address?.postalCode || '',
      })
    } catch (error) {
      console.error('Failed to fetch organization:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await organizationApi.updateProfile({
        legalName: formData.legalName,
        tradingName: formData.tradingName || undefined,
        industry: formData.industry,
        description: formData.description,
        website: formData.website || undefined,
        representativeName: formData.representativeName,
        representativeTitle: formData.representativeTitle,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode || undefined,
        },
      })
      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Organization Profile</h1>
          <p className="text-slate-600 mb-8">Manage your organization details</p>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-6">
              {/* Organization Information */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-primary-600" />
                  Organization Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Legal Name</label>
                    <input
                      type="text"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trading Name</label>
                    <input
                      type="text"
                      name="tradingName"
                      value={formData.tradingName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div className="mt-4">
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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Representative Information */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-primary-600" />
                  Representative Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Representative Name</label>
                    <input
                      type="text"
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Representative Title</label>
                    <input
                      type="text"
                      name="representativeTitle"
                      value={formData.representativeTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary-600" />
                  Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
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
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
