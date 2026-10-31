import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Building2, GraduationCap, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import TagInput from '../../components/TagInput'
import { industryOptions, otherIndustryOption } from '../../constants/industries'

export default function Register() {
  const [role, setRole] = useState<'student' | 'organization_representative'>('student')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    institution: '',
    department: '',
    fieldOfStudy: '',
    currentLevel: '',
    expectedDurationWeeks: '',
    preferredLocations: '',
    skills: [] as string[],
    legalName: '',
    tradingName: '',
    registrationNumber: '',
    industry: '',
    customIndustry: '',
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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (
      role === 'organization_representative' &&
      formData.industry === otherIndustryOption &&
      !formData.customIndustry.trim()
    ) {
      setError('Enter your organization’s industry.')
      return
    }

    setIsLoading(true)

    try {
      const credentials = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      }

      if (role === 'student') {
        await register({
          ...credentials,
          role,
          student: {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber || undefined,
            institution: formData.institution || undefined,
            department: formData.department || undefined,
            fieldOfStudy: formData.fieldOfStudy || undefined,
            currentLevel: formData.currentLevel || undefined,
            expectedDurationWeeks: formData.expectedDurationWeeks
              ? parseInt(formData.expectedDurationWeeks)
              : undefined,
            preferredLocations: formData.preferredLocations
              ? formData.preferredLocations.split(',').map((value) => value.trim())
              : undefined,
            skills: formData.skills.length > 0 ? formData.skills : undefined,
          },
        })
      } else {
        await register({
          ...credentials,
          role,
          organization: {
            legalName: formData.legalName,
            tradingName: formData.tradingName || undefined,
            registrationNumber: formData.registrationNumber,
            industry:
              formData.industry === otherIndustryOption
                ? formData.customIndustry.trim()
                : formData.industry,
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
          },
        })
      }

      navigate(role === 'student' ? '/student/dashboard' : '/organization/verification')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-title font-display font-semibold text-ink">Create Your Account</h1>
          <p className="mt-3 text-ink-muted">Join ITSync today</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-ink mb-3">Register as...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  role === 'student'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-line hover:border-slate-300'
                  }`}
              >
                <GraduationCap className={`mx-auto mb-2 ${role === 'student' ? 'text-primary-600' : 'text-slate-400'}`} size={32} />
                <span className={`font-medium ${role === 'student' ? 'text-primary-700' : 'text-ink-muted'}`}>
                  Student
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole('organization_representative')}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  role === 'organization_representative'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-line hover:border-slate-300'
                  }`}
              >
                <Building2 className={`mx-auto mb-2 ${role === 'organization_representative' ? 'text-primary-600' : 'text-slate-400'}`} size={32} />
                <span className={`font-medium ${role === 'organization_representative' ? 'text-primary-700' : 'text-ink-muted'}`}>
                  Organization
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-ink">Account Information</h3>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Min 12 characters"
                      required
                      minLength={12}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Confirm password"
                      required
                      minLength={12}
                      maxLength={128}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Student Fields */}
            {role === 'student' && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-semibold text-ink">Student Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="+234..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Institution</label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="University of Lagos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Field of Study</label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Current Level</label>
                    <input
                      type="text"
                      name="currentLevel"
                      value={formData.currentLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="300"
                    />
                  </div>
                </div>
                <TagInput
                  label="Skills"
                  values={formData.skills}
                  onChange={(skills) => setFormData((current) => ({ ...current, skills }))}
                  placeholder="Type a skill and press Enter…"
                />
              </div>
            )}

            {/* Organization Fields */}
            {role === 'organization_representative' && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-semibold text-ink">Organization Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Legal Name</label>
                    <input
                      type="text"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Acme Corporation"
                      required
                      minLength={2}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Trading Name</label>
                    <input
                      type="text"
                      name="tradingName"
                      value={formData.tradingName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Acme Corp"
                      minLength={2}
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Registration Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="RC123456"
                      required
                      minLength={3}
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Industry</label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      required
                    >
                      <option value="">Select your industry</option>
                      {industryOptions.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.industry === otherIndustryOption && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Industry name</label>
                    <input
                      type="text"
                      name="customIndustry"
                      value={formData.customIndustry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Enter your organization’s industry"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    placeholder="Brief description of your organization"
                    required
                    minLength={20}
                    maxLength={3000}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Representative Name</label>
                    <input
                      type="text"
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Jane Smith"
                      required
                      minLength={2}
                      maxLength={160}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Representative Title</label>
                    <input
                      type="text"
                      name="representativeTitle"
                      value={formData.representativeTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="HR Manager"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="12 Example Street"
                      required
                      minLength={3}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Lagos"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      placeholder="Lagos"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Create Account <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
