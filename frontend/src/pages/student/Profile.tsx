import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, GraduationCap, MapPin, Save, User, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import TagInput from '../../components/TagInput'
import { notify } from '../../lib/notify'

const profileSections = [
  { id: 'about', label: 'About', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'skills', label: 'Skills', icon: Wrench },
] as const

type ProfileSection = (typeof profileSections)[number]['id']

const institutions = [
  'Abia State University',
  'Ahmadu Bello University',
  'Babcock University',
  'Bayero University Kano',
  'Benue State University',
  'Caleb University',
  'Covenant University',
  'Delta State University',
  'Ebonyi State University',
  'Ekiti State University',
  'Enugu State University of Science and Technology',
  'Federal University of Agriculture, Abeokuta',
  'Federal University of Technology, Akure',
  'Federal University of Technology, Minna',
  'Federal University of Technology, Owerri',
  'Imo State University',
  'Kwara State University',
  'Lagos State University',
  'Landmark University',
  'Nnamdi Azikiwe University',
  'Obafemi Awolowo University',
  'Olabisi Onabanjo University',
  'Pan-Atlantic University',
  'Rivers State University',
  'University of Abuja',
  'University of Benin',
  'University of Calabar',
  'University of Ibadan',
  'University of Ilorin',
  'University of Jos',
  'University of Lagos',
  'University of Maiduguri',
  'University of Nigeria, Nsukka',
  'University of Port Harcourt',
  'Usmanu Danfodiyo University',
]
const otherInstitutionOption = 'Other / not listed'
const institutionOptions = new Set(institutions)

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10'

function ProfileField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
  max,
}: {
  label: string
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  required?: boolean
  min?: number
  max?: number
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className={inputClassName}
      />
    </label>
  )
}

export default function StudentProfile() {
  const { studentProfile, updateProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<ProfileSection>('about')
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    institution: '',
    matricNumber: '',
    customInstitution: '',
    department: '',
    fieldOfStudy: '',
    currentLevel: '',
    expectedDurationWeeks: '',
    preferredLocations: '',
    skills: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (studentProfile) {
      setFormData({
        fullName: studentProfile.fullName || '',
        phoneNumber: studentProfile.phoneNumber || '',
        institution: institutionOptions.has(studentProfile.institution || '')
          ? studentProfile.institution || ''
          : studentProfile.institution
            ? otherInstitutionOption
            : '',
        matricNumber: studentProfile.matricNumber || '',
        customInstitution: institutionOptions.has(studentProfile.institution || '')
          ? ''
          : studentProfile.institution || '',
        department: studentProfile.department || '',
        fieldOfStudy: studentProfile.fieldOfStudy || '',
        currentLevel: studentProfile.currentLevel || '',
        expectedDurationWeeks: studentProfile.expectedDurationWeeks?.toString() || '',
        preferredLocations: studentProfile.preferredLocations?.join(', ') || '',
        skills: studentProfile.skills || [],
      })
    }
  }, [studentProfile])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      await updateProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        institution:
          (formData.institution === otherInstitutionOption
            ? formData.customInstitution
            : formData.institution
          ).trim() || undefined,
        matricNumber: formData.matricNumber.trim() || undefined,
        department: formData.department.trim() || undefined,
        fieldOfStudy: formData.fieldOfStudy.trim() || undefined,
        currentLevel: formData.currentLevel.trim() || undefined,
        expectedDurationWeeks: formData.expectedDurationWeeks
          ? Number.parseInt(formData.expectedDurationWeeks, 10)
          : undefined,
        preferredLocations: formData.preferredLocations
          ? formData.preferredLocations.split(',').map((location) => location.trim()).filter(Boolean)
          : undefined,
        skills: formData.skills,
      })
      notify.success('Your profile has been saved.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const completedSections: Record<ProfileSection, boolean> = {
    about: Boolean(formData.fullName && formData.phoneNumber),
    education: Boolean(formData.institution && formData.fieldOfStudy),
    location: Boolean(formData.preferredLocations.trim()),
    skills: formData.skills.length > 0,
  }
  const activeSectionDetails = profileSections.find((section) => section.id === activeSection)!
  const ActiveIcon: LucideIcon = activeSectionDetails.icon
  const completedCount = Object.values(completedSections).filter(Boolean).length

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                Make it yours
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">Your profile</h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Keep your details up to date to get more relevant opportunities.
              </p>
            </div>
            <Link
              to="/student/opportunities"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700"
            >
              Browse opportunities
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid min-h-[560px] md:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="border-b border-slate-200 bg-slate-50/80 p-3 md:border-b-0 md:border-r md:p-4">
                <div className="mb-4 hidden px-3 pt-2 md:block">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile sections</p>
                </div>
                <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                  {profileSections.map((section) => {
                    const Icon = section.icon
                    const isActive = activeSection === section.id
                    return (
                      <button
                        key={section.id}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          setActiveSection(section.id)
                        }}
                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition md:w-full ${
                          isActive
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={17} className={isActive ? 'text-primary-700' : 'text-slate-400'} />
                        <span>{section.label}</span>
                        {completedSections[section.id] && (
                          <span className="ml-auto hidden text-primary-600 md:block" aria-label="Complete">
                            <Check size={15} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>

                <div className="mt-6 hidden rounded-xl border border-primary-100 bg-primary-50/70 p-4 md:block">
                  <p className="text-sm font-semibold text-slate-800">Profile progress</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {completedCount} of {profileSections.length} sections have the essentials filled in.
                  </p>
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-100"
                    role="progressbar"
                    aria-label="Profile completion"
                    aria-valuemin={0}
                    aria-valuemax={profileSections.length}
                    aria-valuenow={completedCount}
                  >
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all"
                      style={{ width: `${(completedCount / profileSections.length) * 100}%` }}
                    />
                  </div>
                </div>
              </aside>

              <form onSubmit={handleSubmit} className="flex min-w-0 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 md:hidden">
                      <ActiveIcon size={18} />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">{activeSectionDetails.label}</h2>
                      <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                        {activeSection === 'about' && 'Tell us how to identify and contact you.'}
                        {activeSection === 'education' && 'Share your academic background.'}
                        {activeSection === 'location' && 'Choose where you would like to work.'}
                        {activeSection === 'skills' && 'Highlight the skills you bring to a placement.'}
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-xs font-medium text-slate-500 sm:block">Profile settings</span>
                </div>

                <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mx-auto max-w-2xl space-y-5"
                  >
                    {activeSection === 'about' && (
                      <>
                        <div className="mb-7 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-lg font-semibold text-primary-800">
                            {formData.fullName
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join('') || <User size={22} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {formData.fullName || 'Your name'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">Student profile</p>
                          </div>
                        </div>
                        <ProfileField
                          label="Full name"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Your full name"
                          required
                        />
                        <ProfileField
                          label="Phone number"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="+234 800 000 0000"
                          type="tel"
                        />
                      </>
                    )}

                    {activeSection === 'education' && (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-600">Institution</span>
                          <select
                            name="institution"
                            value={
                              formData.institution === otherInstitutionOption ||
                              (formData.institution && !institutionOptions.has(formData.institution))
                                ? otherInstitutionOption
                                : formData.institution
                            }
                            onChange={(event) => {
                              setFormData((current) => ({
                                ...current,
                                institution:
                                  event.target.value === otherInstitutionOption
                                    ? otherInstitutionOption
                                    : event.target.value,
                              }))
                            }}
                            className={inputClassName}
                          >
                            <option value="">Select your institution</option>
                            {institutions.map((institution) => (
                              <option key={institution} value={institution}>
                                {institution}
                              </option>
                            ))}
                            <option value={otherInstitutionOption}>{otherInstitutionOption}</option>
                          </select>
                        </label>
                        {formData.institution === otherInstitutionOption && (
                          <ProfileField
                            label="Institution name"
                            name="customInstitution"
                            value={formData.customInstitution}
                            onChange={handleChange}
                            placeholder="Enter your institution"
                          />
                        )}
                        <ProfileField
                          label="Matric number"
                          name="matricNumber"
                          value={formData.matricNumber}
                          onChange={handleChange}
                          placeholder="Enter your matriculation number"
                        />
                        <ProfileField
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="Your department"
                        />
                        <div className="grid gap-5 sm:grid-cols-2">
                          <ProfileField
                            label="Field of study"
                            name="fieldOfStudy"
                            value={formData.fieldOfStudy}
                            onChange={handleChange}
                            placeholder="e.g. Computer Science"
                          />
                          <ProfileField
                            label="Current level"
                            name="currentLevel"
                            value={formData.currentLevel}
                            onChange={handleChange}
                            placeholder="e.g. 300 level"
                          />
                        </div>
                        <ProfileField
                          label="Expected placement duration (weeks)"
                          name="expectedDurationWeeks"
                          value={formData.expectedDurationWeeks}
                          onChange={handleChange}
                          placeholder="e.g. 24"
                          type="number"
                          min={1}
                          max={104}
                        />
                      </>
                    )}

                    {activeSection === 'location' && (
                      <>
                        <div className="rounded-2xl bg-primary-50/70 p-4">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="mt-0.5 shrink-0 text-primary-700" />
                            <p className="text-sm leading-6 text-slate-600">
                              Your preferred locations help us recommend placements that are a better fit.
                            </p>
                          </div>
                        </div>
                        <ProfileField
                          label="Preferred locations"
                          name="preferredLocations"
                          value={formData.preferredLocations}
                          onChange={handleChange}
                          placeholder="Lagos, Abuja, Port Harcourt"
                        />
                        <p className="-mt-3 text-xs text-slate-500">Separate multiple locations with commas.</p>
                      </>
                    )}

                    {activeSection === 'skills' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-primary-50/70 p-4">
                          <div className="flex items-start gap-3">
                            <Wrench size={18} className="mt-0.5 shrink-0 text-primary-700" />
                            <p className="text-sm leading-6 text-slate-600">
                              Add tools, technologies, and strengths you would bring to a placement. Press Enter or a comma after each skill.
                            </p>
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
                  </motion.div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <p className="text-xs text-slate-500">Your information is only used to personalize your experience.</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
