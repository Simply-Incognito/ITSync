import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, GraduationCap, MapPin, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function StudentProfile() {
  const { studentProfile, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    institution: '',
    department: '',
    fieldOfStudy: '',
    currentLevel: '',
    expectedDurationWeeks: '',
    preferredLocations: '',
    skills: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (studentProfile) {
      setFormData({
        fullName: studentProfile.fullName || '',
        phoneNumber: studentProfile.phoneNumber || '',
        institution: studentProfile.institution || '',
        department: studentProfile.department || '',
        fieldOfStudy: studentProfile.fieldOfStudy || '',
        currentLevel: studentProfile.currentLevel || '',
        expectedDurationWeeks: studentProfile.expectedDurationWeeks?.toString() || '',
        preferredLocations: studentProfile.preferredLocations?.join(', ') || '',
        skills: studentProfile.skills?.join(', ') || '',
      })
    }
  }, [studentProfile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await updateProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        institution: formData.institution || undefined,
        department: formData.department || undefined,
        fieldOfStudy: formData.fieldOfStudy || undefined,
        currentLevel: formData.currentLevel || undefined,
        expectedDurationWeeks: formData.expectedDurationWeeks ? parseInt(formData.expectedDurationWeeks) : undefined,
        preferredLocations: formData.preferredLocations ? formData.preferredLocations.split(',').map((s) => s.trim()) : undefined,
        skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()) : undefined,
      })
      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-600 mb-8">Manage your personal and academic information</p>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-primary-600" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary-600" />
                  Academic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Institution</label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Level</label>
                    <input
                      type="text"
                      name="currentLevel"
                      value={formData.currentLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expected Duration (weeks)</label>
                    <input
                      type="number"
                      name="expectedDurationWeeks"
                      value={formData.expectedDurationWeeks}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary-600" />
                  Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Locations</label>
                    <input
                      type="text"
                      name="preferredLocations"
                      value={formData.preferredLocations}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Lagos, Abuja, Port Harcourt"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate multiple locations with commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="JavaScript, React, Python"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate multiple skills with commas</p>
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
