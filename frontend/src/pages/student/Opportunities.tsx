import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { applicationApi, opportunityApi, studentDocumentApi } from '../../services/api'
import { notify } from '../../lib/notify'
import type {
  Application,
  Opportunity,
  StudentProfile,
  StudentVerificationDocumentType,
} from '../../types/domain'
import { getOrganizationName } from '../../utils/display'
import { getOpportunityImageUrl } from '../../utils/opportunity-images'

type OpportunityTab = 'for-you' | 'saved' | 'applied' | 'all'
const opportunitiesPerPage = 10
const opportunityFetchLimit = 100

const tabs: { id: OpportunityTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'all', label: 'All Opportunities' },
]

function getOrganizationInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function formatArrangement(arrangement: Opportunity['workArrangement']) {
  return arrangement === 'onsite' ? 'On-site' : arrangement[0].toUpperCase() + arrangement.slice(1)
}

function getAvailabilityLabel(opportunity: Opportunity) {
  if (opportunity.status === 'closed') return 'Closed'
  if (new Date(opportunity.applicationDeadline).getTime() < Date.now()) return 'Expired'
  return 'Ongoing'
}

function isOpportunityUnavailable(opportunity: Opportunity) {
  return getAvailabilityLabel(opportunity) !== 'Ongoing'
}

const relatedCourseGroups = [
  [
    'computer science',
    'software engineering',
    'software development',
    'information technology',
    'information systems',
    'computer engineering',
    'cybersecurity',
    'data science',
    'artificial intelligence',
    'informatics',
  ],
  ['accounting', 'accountancy', 'finance', 'banking', 'business administration', 'economics', 'marketing'],
  ['mechanical engineering', 'mechatronics', 'automotive engineering'],
  ['electrical engineering', 'electronic engineering', 'electronics', 'telecommunications'],
  ['civil engineering', 'structural engineering', 'construction management'],
  ['chemical engineering', 'petroleum engineering', 'process engineering'],
  ['medicine', 'nursing', 'pharmacy', 'public health', 'dentistry', 'physiotherapy', 'medical laboratory science'],
  ['agriculture', 'agronomy', 'crop science', 'animal science', 'agricultural economics'],
  ['law', 'legal studies'],
  ['mass communication', 'journalism', 'public relations', 'media studies'],
  ['architecture', 'urban planning', 'building technology', 'estate management'],
]

const genericCourseWords = new Set([
  'and',
  'arts',
  'engineering',
  'management',
  'of',
  'science',
  'studies',
  'technology',
  'the',
])

function normalizeMatchText(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
}

function getCourseMatchScore(opportunity: Opportunity, courses: string[]) {
  const field = normalizeMatchText(opportunity.fieldOfStudy || '')
  const title = normalizeMatchText(opportunity.title || '')
  const details = normalizeMatchText(
    [
      opportunity.description,
      opportunity.academicRequirements,
      opportunity.additionalRequirements,
      ...(opportunity.requiredSkills ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  )
  let score = 0

  for (const course of courses) {
    const normalizedCourse = normalizeMatchText(course)
    if (normalizedCourse.trim() && field.includes(normalizedCourse)) {
      score = Math.max(score, 100)
    }

    const relatedGroups = relatedCourseGroups.filter((group) =>
      group.some((term) => normalizedCourse.includes(normalizeMatchText(term))),
    )
    for (const relatedTerms of relatedGroups) {
      if (relatedTerms.some((term) => field.includes(normalizeMatchText(term)))) {
        score = Math.max(score, 85)
      }
      if (relatedTerms.some((term) => title.includes(normalizeMatchText(term)))) {
        score = Math.max(score, 75)
      }
      if (relatedTerms.some((term) => details.includes(normalizeMatchText(term)))) {
        score = Math.max(score, 60)
      }
    }

    const courseWords = normalizedCourse
      .trim()
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !genericCourseWords.has(word))
    if (courseWords.some((word) => field.includes(` ${word} `))) {
      score = Math.max(score, 55)
    }
    if (courseWords.some((word) => title.includes(` ${word} `))) {
      score = Math.max(score, 45)
    }
    if (courseWords.some((word) => details.includes(` ${word} `))) {
      score = Math.max(score, 35)
    }
  }

  return score
}

function getRecommendedOpportunities(opportunities: Opportunity[], profile: StudentProfile | null) {
  const courses = [profile?.fieldOfStudy, profile?.department].filter(
    (course): course is string => Boolean(course?.trim()),
  )
  const preferredLocations = profile?.preferredLocations?.map((location) => location.trim().toLowerCase()).filter(Boolean) ?? []

  if (courses.length === 0) return []

  return opportunities
    .filter(
      (opportunity) =>
        opportunity.status === 'published' &&
        new Date(opportunity.applicationDeadline).getTime() >= Date.now(),
    )
    .map((opportunity) => {
      const courseScore = getCourseMatchScore(opportunity, courses)
      const opportunityLocation = [
        opportunity.location.city,
        opportunity.location.state,
        opportunity.location.country,
      ]
        .join(' ')
        .toLowerCase()
      const locationMatches = preferredLocations.some((location) => opportunityLocation.includes(location))

      const profileSkills = profile?.skills?.map((skill) => normalizeMatchText(skill)) ?? []
      const opportunitySkills = (opportunity.requiredSkills ?? []).map((skill) => normalizeMatchText(skill))
      const matchingSkills = profileSkills.filter((skill) => opportunitySkills.includes(skill)).length

      return { opportunity, courseScore, locationMatches, matchingSkills }
    })
    .filter(({ courseScore }) => courseScore > 0)
    .sort(
      (first, second) =>
        second.courseScore - first.courseScore ||
        second.matchingSkills - first.matchingSkills ||
        Number(second.locationMatches) - Number(first.locationMatches),
    )
    .map(({ opportunity }) => opportunity)
}

export default function StudentOpportunities() {
  const { studentProfile } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [applyingId, setApplyingId] = useState('')
  const [appliedOpportunityIds, setAppliedOpportunityIds] = useState<Set<string>>(new Set())
  const [appliedOpportunityCount, setAppliedOpportunityCount] = useState(0)
  const [appliedOpportunities, setAppliedOpportunities] = useState<Opportunity[]>([])
  const [savedOpportunityIds, setSavedOpportunityIds] = useState(
    () => new Set(localStorage.getItem('itsync:saved-opportunities')?.split(',').filter(Boolean) ?? []),
  )
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [verificationDocumentType, setVerificationDocumentType] =
    useState<StudentVerificationDocumentType>('student_id')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<OpportunityTab>('for-you')
  const [currentPage, setCurrentPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    fieldOfStudy: '',
    location: '',
    workArrangement: '',
  })

  useEffect(() => {
    void fetchOpportunities()
    void fetchMyApplications()
  }, [])

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (filters.fieldOfStudy) params.fieldOfStudy = filters.fieldOfStudy
      if (filters.location) params.location = filters.location
      if (filters.workArrangement) params.workArrangement = filters.workArrangement

      const firstPage = await opportunityApi.list({
        ...params,
        page: '1',
        limit: String(opportunityFetchLimit),
      })
      const allOpportunities = [...firstPage.opportunities]
      const pageBatchSize = 5

      for (
        let firstPageInBatch = 2;
        firstPageInBatch <= firstPage.pagination.totalPages;
        firstPageInBatch += pageBatchSize
      ) {
        const pages = Array.from(
          {
            length: Math.min(
              pageBatchSize,
              firstPage.pagination.totalPages - firstPageInBatch + 1,
            ),
          },
          (_, index) => firstPageInBatch + index,
        )
        const responses = await Promise.all(
          pages.map((page) =>
            opportunityApi.list({
              ...params,
              page: String(page),
              limit: String(opportunityFetchLimit),
            }),
          ),
        )
        allOpportunities.push(...responses.flatMap((response) => response.opportunities))
      }

      setOpportunities(allOpportunities)
      setCurrentPage(1)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to load opportunities.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyApplications = async () => {
    try {
      const firstPage = await applicationApi.listMy({ limit: 100 })
      const applications = [...firstPage.applications]
      const pageBatchSize = 5

      for (let firstPageInBatch = 2; firstPageInBatch <= firstPage.pagination.totalPages; firstPageInBatch += pageBatchSize) {
        const pages = Array.from(
          { length: Math.min(pageBatchSize, firstPage.pagination.totalPages - firstPageInBatch + 1) },
          (_, index) => firstPageInBatch + index,
        )
        const responses = await Promise.all(
          pages.map((page) => applicationApi.listMy({ page, limit: 100 })),
        )
        applications.push(...responses.flatMap((response) => response.applications))
      }

      setAppliedOpportunityCount(firstPage.pagination.total)
      setAppliedOpportunityIds(
        new Set(
          applications
            .map((application: Application) =>
              typeof application.opportunityId === 'string'
                ? application.opportunityId
                : application.opportunityId?._id,
            )
            .filter((id): id is string => Boolean(id)),
        ),
      )
      setAppliedOpportunities(
        applications
          .map((application) => application.opportunityId)
          .filter(
            (opportunity): opportunity is Opportunity =>
              typeof opportunity === 'object' &&
              opportunity !== null &&
              'fieldOfStudy' in opportunity &&
              'location' in opportunity,
          ),
      )
    } catch (error) {
      console.error('Failed to load your applications:', error)
    }
  }

  const recommendedOpportunities = useMemo(
    () => getRecommendedOpportunities(opportunities, studentProfile),
    [opportunities, studentProfile],
  )

  const visibleOpportunities = useMemo(() => {
    if (activeTab === 'for-you') return recommendedOpportunities
    if (activeTab === 'saved') {
      return opportunities.filter((opportunity) => savedOpportunityIds.has(opportunity._id))
    }
    if (activeTab === 'applied') {
      return appliedOpportunities
    }
    return opportunities
  }, [activeTab, appliedOpportunities, opportunities, recommendedOpportunities, savedOpportunityIds])
  const totalPages = Math.max(1, Math.ceil(visibleOpportunities.length / opportunitiesPerPage))
  const paginatedOpportunities = visibleOpportunities.slice(
    (currentPage - 1) * opportunitiesPerPage,
    currentPage * opportunitiesPerPage,
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const toggleSaved = (opportunityId: string) => {
    setSavedOpportunityIds((current) => {
      const next = new Set(current)
      const isSaving = !next.has(opportunityId)
      if (isSaving) next.add(opportunityId)
      else next.delete(opportunityId)
      localStorage.setItem('itsync:saved-opportunities', [...next].join(','))
      notify.success(isSaving ? 'Saved to your list.' : 'Removed from saved opportunities.')
      return next
    })
  }

  const applyForOpportunity = async (opportunityId: string) => {
    if (!verificationFile) {
      notify.error('Upload your student ID or biodata to continue.')
      return
    }

    setApplyingId(opportunityId)
    try {
      const { document } = await studentDocumentApi.upload(
        verificationFile,
        verificationDocumentType,
      )
      await applicationApi.create({
        opportunityId,
        studentDocumentIds: [document.documentId],
      })
      setAppliedOpportunityIds((current) => new Set(current).add(opportunityId))
      const appliedOpportunity = opportunities.find((opportunity) => opportunity._id === opportunityId)
      if (appliedOpportunity) {
        setAppliedOpportunities((current) =>
          current.some((opportunity) => opportunity._id === opportunityId)
            ? current
            : [appliedOpportunity, ...current],
        )
        setAppliedOpportunityCount((count) => count + 1)
      }
      notify.success('Application submitted. Track it under My Applications.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Unable to submit your application.')
    } finally {
      setApplyingId('')
    }
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    void fetchOpportunities()
  }

  const openDetails = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
    setVerificationFile(null)
    setVerificationDocumentType('student_id')
  }

  return (
    <div className="workspace-page min-h-screen bg-slate-50 py-6 sm:py-9">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              {/* <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                Your next chapter starts here
              </p> */}
              <h1 className="text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                Find your opportunity
              </h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Explore industrial placements from organizations looking for talent like you.
              </p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 sm:flex">
              <Briefcase size={22} />
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center px-1">
              <div className="-mx-1 flex min-w-0 items-center overflow-x-auto sm:mx-0 sm:shrink-0">
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 p-0.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap rounded-lg px-1 py-0.5 text-xs font-medium transition sm:px-2 sm:py-1 ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                      {tab.id !== 'all' && (
                        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-100 px-1 py-0.5 text-xs font-semibold leading-none text-primary-700">
                          {tab.id === 'for-you'
                            ? recommendedOpportunities.length
                            : tab.id === 'saved'
                              ? savedOpportunityIds.size
                              : appliedOpportunityCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:gap-3 sm:px-0 sm:pl-3">
                <div className="hidden h-8 w-px bg-slate-200 sm:block" />
                <Search className="shrink-0 text-slate-400" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search opportunities"
                  placeholder="Search by title, location, or field..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:px-2"
                />
                <button
                  type="button"
                  aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                    filtersOpen
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={18} />
                </button>
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="absolute right-2 top-[calc(100%-0.5rem)] z-40 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-slate-900/5">
                <h2 className="mb-4 text-base font-semibold text-slate-800">Filters</h2>
                <label className="block text-sm font-medium text-slate-500">
                  Workplace
                  <select
                    value={filters.workArrangement}
                    onChange={(event) => setFilters({ ...filters, workArrangement: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  >
                    <option value="">All workplaces</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </label>

                <label className="mt-4 block text-sm font-medium text-slate-500">
                  Category
                  <select
                    value={filters.fieldOfStudy}
                    onChange={(event) => setFilters({ ...filters, fieldOfStudy: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  >
                    <option value="">All categories</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </label>

                <label className="mt-4 block text-sm font-medium text-slate-500">
                  Location
                  <select
                    value={filters.location}
                    onChange={(event) => setFilters({ ...filters, location: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  >
                    <option value="">All locations</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                    <option value="Kano">Kano</option>
                  </select>
                </label>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setFilters({ fieldOfStudy: '', location: '', workArrangement: '' })}
                    className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Clear filters
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {activeTab === 'saved'
                  ? 'Saved opportunities'
                  : activeTab === 'applied'
                    ? 'Your applications'
                    : activeTab === 'all'
                      ? 'All opportunities'
                      : 'Opportunities picked for you'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {loading
                  ? 'Finding opportunities…'
                  : activeTab === 'for-you'
                    ? `${visibleOpportunities.length} course-related opportunities`
                    : activeTab === 'all'
                      ? `${visibleOpportunities.length} posted opportunities, including expired and closed listings`
                      : `${visibleOpportunities.length} opportunities`}
              </p>
            </div>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex">
              <Check size={14} className="text-primary-600" />
              Verified organizations
            </span>
          </div>

          {loading ? (
            <div className="space-y-4" aria-label="Loading opportunities">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : visibleOpportunities.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                {activeTab === 'saved' ? <Bookmark size={24} /> : <Briefcase size={24} />}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {activeTab === 'saved'
                  ? 'No saved opportunities yet'
                  : activeTab === 'applied'
                    ? 'No applications to show yet'
                    : activeTab === 'for-you'
                      ? 'No recommendations yet'
                      : 'No opportunities found'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {activeTab === 'saved'
                  ? 'Save a role that catches your eye and it will be waiting for you here.'
                  : activeTab === 'applied'
                    ? 'When you apply to an opportunity, you can follow it here.'
                    : activeTab === 'for-you'
                      ? 'Recommendations are based on your course or related fields mentioned in an opportunity’s field, title, requirements, or skills. Add your course or department to your profile to get matched.'
                    : 'Try a different search or adjust your filters to find more opportunities.'}
              </p>
              {activeTab === 'for-you' && (
                <Link
                  to="/student/profile"
                  className="mt-5 inline-flex rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Update profile
                </Link>
              )}
              {(activeTab === 'saved' || activeTab === 'applied') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('for-you')}
                  className="mt-5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Browse opportunities
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="space-y-4">
              {paginatedOpportunities.map((opportunity, index) => {
                const organizationName = getOrganizationName(opportunity.organizationId)
                const opportunityIndustry =
                  typeof opportunity.organizationId === 'object' && opportunity.organizationId
                    ? opportunity.organizationId.industry ?? ''
                    : ''
                const isSaved = savedOpportunityIds.has(opportunity._id)
                const isApplied = appliedOpportunityIds.has(opportunity._id)
                const availabilityLabel = getAvailabilityLabel(opportunity)
                const isClosed = isOpportunityUnavailable(opportunity)
                return (
                  <motion.article
                    key={opportunity._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            scale: 1.015,
                            y: -4,
                            transition: {
                              duration: 1.8,
                              ease: 'easeInOut',
                            },
                          }
                    }
                    transition={{
                      delay: Math.min(index * 0.04, 0.2),
                      duration: 1.8,
                      ease: 'easeInOut',
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-[1800ms] ease-in-out hover:z-10 hover:border-primary-200 hover:shadow-xl"
                  >
                    <div className="grid sm:grid-cols-[minmax(0,1fr)_42%]">
                      <div className="order-2 flex min-w-0 flex-col p-5 sm:order-1 sm:p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
                            {organizationName ? (
                              getOrganizationInitials(organizationName)
                            ) : (
                              <Building2 size={21} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold leading-snug text-slate-800 sm:text-xl">
                                {opportunity.title}
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isClosed
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {availabilityLabel}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm font-medium text-slate-600">
                              {organizationName || opportunity.fieldOfStudy}
                              <span className="mx-2 text-slate-300">|</span>
                              <span className="font-normal text-slate-500">{opportunity.fieldOfStudy}</span>
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                          {opportunity.description}
                        </p>

                        <div className="mt-auto grid grid-cols-1 gap-x-6 gap-y-2 pt-5 text-sm text-slate-500 sm:grid-cols-2">
                          <span className="inline-flex items-center gap-2">
                            <MapPin size={15} className="shrink-0 text-slate-400" />
                            {[opportunity.location.city, opportunity.location.state].filter(Boolean).join(', ')}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={15} className="shrink-0 text-slate-400" />
                            {opportunity.durationWeeks} weeks
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Briefcase size={15} className="shrink-0 text-slate-400" />
                            {formatArrangement(opportunity.workArrangement)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Building2 size={15} className="shrink-0 text-slate-400" />
                            {opportunity.availableSlots} {opportunity.availableSlots === 1 ? 'slot' : 'slots'}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => openDetails(opportunity)}
                            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                          >
                            View opportunity
                          </button>
                          {isApplied && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700">
                              <Check size={14} />
                              Applied
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="group/image relative order-1 min-h-40 overflow-hidden bg-slate-900 sm:order-2 sm:min-h-[280px] sm:[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
                        <img
                          src={getOpportunityImageUrl(opportunity.imageKey, opportunityIndustry)}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2500ms] ease-in-out group-hover/image:scale-110 motion-reduce:scale-100 motion-reduce:transition-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10" />
                        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors duration-300 group-hover:border-white/50 group-hover:bg-slate-950/55">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-300" />
                          {opportunity.fieldOfStudy}
                        </div>
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove saved opportunity' : 'Save opportunity'}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(opportunity._id)}
                          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                        >
                          <Bookmark size={16} className={isSaved ? 'fill-primary-600 text-primary-600' : ''} />
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                        <span className="absolute bottom-4 right-4 rounded-full border border-white/40 bg-slate-950/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                          {formatArrangement(opportunity.workArrangement)}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
            {totalPages > 1 && (
              <nav
                aria-label="Opportunity pages"
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * opportunitiesPerPage + 1}–
                  {Math.min(currentPage * opportunitiesPerPage, visibleOpportunities.length)} of{' '}
                  {visibleOpportunities.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="min-w-16 text-center text-sm font-medium text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
            </>
          )}

          {selectedOpportunity && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedOpportunity(null)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="opportunity-details-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary-700">{selectedOpportunity.fieldOfStudy}</p>
                    <h2 id="opportunity-details-title" className="mt-1 text-2xl font-semibold text-slate-900">
                      {selectedOpportunity.title}
                    </h2>
                    <p className={`mt-2 text-sm font-medium ${isOpportunityUnavailable(selectedOpportunity) ? 'text-slate-500' : 'text-emerald-700'}`}>
                      {getAvailabilityLabel(selectedOpportunity)}
                    </p>
                    {getOrganizationName(selectedOpportunity.organizationId) && (
                      <p className="mt-1 text-sm text-slate-500">
                        {getOrganizationName(selectedOpportunity.organizationId)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Close opportunity details"
                    onClick={() => setSelectedOpportunity(null)}
                    className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
                  <p className="whitespace-pre-line">{selectedOpportunity.description}</p>
                  <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <p>
                      <strong>Location:</strong> {[selectedOpportunity.location.city, selectedOpportunity.location.state, selectedOpportunity.location.country].filter(Boolean).join(', ')}
                    </p>
                    <p><strong>Work arrangement:</strong> {formatArrangement(selectedOpportunity.workArrangement)}</p>
                    <p><strong>Duration:</strong> {selectedOpportunity.durationWeeks} weeks</p>
                    <p><strong>Available slots:</strong> {selectedOpportunity.availableSlots}</p>
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays size={16} />
                      <strong>Deadline:</strong> {new Date(selectedOpportunity.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedOpportunity.requiredSkills.length > 0 && (
                    <p><strong>Required skills:</strong> {selectedOpportunity.requiredSkills.join(', ')}</p>
                  )}
                  {selectedOpportunity.academicRequirements && (
                    <p className="whitespace-pre-line"><strong>Academic requirements:</strong> {selectedOpportunity.academicRequirements}</p>
                  )}
                  {selectedOpportunity.requiredDocuments.length > 0 && (
                    <p><strong>Required documents:</strong> {selectedOpportunity.requiredDocuments.join(', ')}</p>
                  )}
                  {selectedOpportunity.additionalRequirements && (
                    <p className="whitespace-pre-line"><strong>Additional requirements:</strong> {selectedOpportunity.additionalRequirements}</p>
                  )}
                </div>

                {!appliedOpportunityIds.has(selectedOpportunity._id) &&
                  !isOpportunityUnavailable(selectedOpportunity) && (
                    <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                      <p className="font-semibold text-slate-800">Verification document</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Upload either your student ID or biodata. PDF, JPEG, or PNG files up to 1 MB are accepted.
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
                        <label className="block text-sm font-medium text-slate-700">
                          Document type
                          <select
                            value={verificationDocumentType}
                            onChange={(event) =>
                              setVerificationDocumentType(
                                event.target.value === 'biodata' ? 'biodata' : 'student_id',
                              )
                            }
                            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                          >
                            <option value="student_id">Student ID</option>
                            <option value="biodata">Biodata</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Choose file
                          <input
                            type="file"
                            required
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              setVerificationFile(null)
                              if (file && file.size > 1024 * 1024) {
                                notify.error('The verification document must not exceed 1 MB.')
                                event.target.value = ''
                                return
                              }
                              setVerificationFile(file)
                            }}
                            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:font-medium file:text-primary-700"
                          />
                        </label>
                      </div>
                      {verificationFile && (
                        <p className="mt-2 text-xs text-slate-500">
                          Selected: {verificationFile.name} ({(verificationFile.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                      {!verificationFile && (
                        <p className="mt-2 text-xs font-medium text-primary-800">
                          This document is required before you can apply.
                        </p>
                      )}
                    </div>
                  )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(null)}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={
                      applyingId === selectedOpportunity._id ||
                      appliedOpportunityIds.has(selectedOpportunity._id) ||
                      isOpportunityUnavailable(selectedOpportunity) ||
                      !verificationFile
                    }
                    onClick={() => void applyForOpportunity(selectedOpportunity._id)}
                    className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applyingId === selectedOpportunity._id
                      ? 'Submitting…'
                      : appliedOpportunityIds.has(selectedOpportunity._id)
                        ? 'Already applied'
                        : isOpportunityUnavailable(selectedOpportunity)
                          ? 'Applications closed'
                          : 'Apply now'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
