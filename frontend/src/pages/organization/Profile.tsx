import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, MapPin, User, Save } from 'lucide-react'
import { organizationApi } from '../../services/api'
import type { Organization, OrganizationProfileInput } from '../../types/domain'
import { getErrorMessage } from '../../utils/errors'
import { notify } from '../../lib/notify'

interface ProfileFormState {
  legalName: string
  tradingName: string
  industry: string
  description: string
  website: string
  representativeName: string
  representativeTitle: string
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

const emptyForm: ProfileFormState = {
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
}

function toFormState(organization: Organization): ProfileFormState {
  return {
    legalName: organization.legalName,
    tradingName: organization.tradingName ?? '',
    industry: organization.industry,
    description: organization.description,
    website: organization.website ?? '',
    representativeName: organization.representativeName,
    representativeTitle: organization.representativeTitle,
    street: organization.address.street,
    city: organization.address.city,
    state: organization.address.state,
    country: organization.address.country,
    postalCode: organization.address.postalCode ?? '',
  }
}

export default function OrganizationProfile() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [formData, setFormData] = useState<ProfileFormState>(emptyForm)
  const [isFetching, setIsFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    void fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    setIsFetching(true)
    try {
      const response = await organizationApi.getProfile()
      const profile = response.organization

      setOrganization(profile)

      if (!profile) {
        setFetchError('No organization profile is linked to this account.')
        return
      }

      setFetchError('')
      setFormData(toFormState(profile))
    } catch (error) {
      setFetchError(getErrorMessage(error, 'Unable to load your organization profile.'))
    } finally {
      setIsFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload: Partial<OrganizationProfileInput> = {
      legalName: formData.legalName.trim(),
      tradingName: formData.tradingName.trim() || undefined,
      industry: formData.industry.trim(),
      description: formData.description.trim(),
      website: formData.website.trim() || undefined,
      representativeName: formData.representativeName.trim(),
      representativeTitle: formData.representativeTitle.trim(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim() || undefined,
      },
    }

    try {
      const response = await organizationApi.updateProfile(payload)
      setOrganization(response.organization)
      notify.success('Organization profile updated.')
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to save profile. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  if (isFetching) {
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Organization Profile</h1>
            <p className="text-slate-600 mb-8">Manage your organization details</p>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-lg font-semibold text-slate-800">Profile unavailable</h2>
              <p className="text-slate-600 mt-2">
                {fetchError ||
                  'Your organization profile could not be loaded. Try again or return to the dashboard.'}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void fetchOrganization()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Try again
                </button>
                <Link
                  to="/organization/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Organization Profile</h1>
          <p className="text-slate-600 mb-8">Manage your organization details</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-6">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={organization.registrationNumber}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-slate-600"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Contact support if your registration number needs to change.
                  </p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
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
