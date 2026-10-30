import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Opportunity,
  OpportunityFilters,
  OpportunityInput,
  Organization,
  OrganizationDocument,
  OrganizationDocumentType,
  OrganizationProfileInput,
  Pagination,
  RegisterData,
  StudentProfile,
  StudentProfileInput,
  User,
} from '../types/domain'

/**
 * Resolves the API origin.
 *
 * Accepts either an origin ("https://api.example.com") or a full base
 * ("https://api.example.com/api/v1") so a trailing mistake in the deployment
 * environment cannot silently produce duplicated or missing path segments.
 */
function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (!configured) {
    return '/api/v1'
  }

  const withoutTrailingSlash = configured.replace(/\/+$/, '')

  return withoutTrailingSlash.endsWith('/api/v1')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api/v1`
}

const API_BASE = resolveApiBase()

if (import.meta.env.PROD && !/^https?:\/\//.test(API_BASE)) {
  console.error(
    `[ITSync] VITE_API_URL is not configured, so API calls target ${window.location.origin}${API_BASE}. ` +
      'Write requests will fail with 405. Set VITE_API_URL to the deployed API origin and redeploy.',
  )
}

export type AdminUser = {
  _id: string
  email: string
  role: 'student' | 'organization_representative' | 'administrator'
  status: 'active' | 'suspended'
  createdAt: string
  emailVerifiedAt?: string | null
}

export type AdminOrganization = {
  _id: string
  legalName: string
  verificationStatus: 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended'
  verifiedAt?: string | null
  createdAt: string
}

export type AdminStats = {
  totalStudents: number
  totalOrganizations: number
  verifiedOrganizations: number
  pendingVerification: number
  totalApplications: number
  applicationsByStatus: Record<
    'submitted' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn',
    number
  >
  totalOpportunities: number
  publishedOpportunities: number
}

export type AdminLog = {
  _id: string
  actorUserId: string
  action: string
  targetType: 'user' | 'organization' | 'opportunity' | 'application'
  targetId: string
  details: Record<string, unknown>
  createdAt: string
}

export type AdminActivityEvent = {
  _id: string
  actorUserId: string
  action: string
  targetType: 'user' | 'organization' | 'opportunity' | 'application'
  targetId: string
  details: Record<string, unknown>
  createdAt: string
}

export type AdminApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type AdminApplication = {
  _id: string
  status: AdminApplicationStatus
  studentId: string | { fullName?: string; email?: string; institution?: string }
  opportunityId: string | { title?: string }
  createdAt: string
}

export type AdminOpportunity = {
  _id: string
  title: string
  description?: string
  fieldOfStudy?: string
  requiredSkills?: string[]
  academicRequirements?: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'closed' | 'suspended'
  organizationId: string | { _id: string; legalName?: string } | null
  location: { city: string; state: string; country: string }
  workArrangement?: 'onsite' | 'hybrid' | 'remote'
  durationWeeks?: number
  availableSlots?: number
  applicationDeadline: string
  requiredDocuments?: string[]
  additionalRequirements?: string
  createdAt: string
  reviewNote?: string | null
}

export type OrganizationReviewProfile = {
  _id: string
  legalName: string
  tradingName?: string | null
  registrationCountry: string
  registrationNumber: string
  industry: string
  description: string
  website?: string | null
  representativeName: string
  representativeTitle: string
  representativeUserId: string
  verificationStatus: AdminOrganization['verificationStatus']
  rejectionReason?: string | null
  suspensionReason?: string | null
  address: { street: string; city: string; state: string; country: string; postalCode?: string | null }
}

export type OrganizationReviewDocument = {
  id: string
  documentType: string
  originalName: string
  contentType: string
  byteSize: number
  uploadedAt: string
}

export type OrganizationReviewEvent = {
  _id: string
  actorUserId: string
  action: string
  fromStatus?: string
  toStatus: string
  note?: string
  createdAt: string
  registrySource?: string
  registryReference?: string
}

type AdminPagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ApiErrorResponse {
  error?: {
    message?: string
    issues?: Array<{ path: Array<string | number>; message: string }>
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJsonResponse = contentType.includes('application/json')

  if (!response.ok) {
    if (!isJsonResponse) {
      // A static host answers writes with 405 and an HTML body, which is the
      // signature of a missing or wrong VITE_API_URL rather than an API error.
      throw new Error(
        `API request to ${endpoint} returned ${response.status} ${response.statusText}. ` +
          'The request reached the frontend host instead of the API — check VITE_API_URL.',
      )
    }

    const body = (await response.json()) as ApiErrorResponse
    const issues = body?.error?.issues
      ?.map(({ path, message }) => `${path.join('.')}: ${message}`)
      .filter(Boolean)
    const message = issues?.length
      ? issues.join(' ')
      : body?.error?.message || 'An error occurred'
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  if (!isJsonResponse) {
    throw new Error(
      `Expected JSON from ${endpoint} but received "${contentType || 'unknown'}". ` +
        'VITE_API_URL is probably pointing at the frontend instead of the API.',
    )
  }

  return response.json()
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterData) =>
    request<{ accessToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<{ user: User; student: StudentProfile | null }>('/auth/me'),

  updateStudentProfile: (data: Partial<StudentProfileInput>) =>
    request<StudentProfile>('/auth/student-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
}

export const studentApi = {
  getProfile: () => request<{ student: StudentProfile }>('/students/me'),
  createProfile: (data: StudentProfileInput) =>
    request<{ student: StudentProfile }>('/students/me', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: Partial<StudentProfileInput>) =>
    request<{ student: StudentProfile }>('/students/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

export const organizationApi = {
  getProfile: () =>
    request<{ organization: Organization | null; documents: OrganizationDocument[] }>(
      '/organizations/me',
    ),
  createProfile: (data: OrganizationProfileInput) =>
    request<{ organization: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: Partial<OrganizationProfileInput>) =>
    request<{ organization: Organization }>('/organizations/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitForVerification: () =>
    request<{ organization: Organization }>('/organizations/me/verification', {
      method: 'POST',
    }),
  uploadDocument: async (file: File, documentType: OrganizationDocumentType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)

    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/organizations/me/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined
      throw new Error(body?.error?.message || 'Failed to upload document')
    }

    return (await response.json()) as { document: OrganizationDocument }
  },
}

export const opportunityApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<{ opportunities: Opportunity[]; pagination: Pagination }>(
      `/opportunities${query}`,
    )
  },
  get: (id: string) => request<{ opportunity: Opportunity }>(`/opportunities/${id}`),
  getFilters: () => request<{ filters: OpportunityFilters }>('/opportunities/filters'),
  create: (data: OpportunityInput) =>
    request<{ opportunity: Opportunity }>('/opportunities/me', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<OpportunityInput>) =>
    request<{ opportunity: Opportunity }>(`/opportunities/me/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listMy: () => request<{ opportunities: Opportunity[] }>('/opportunities/me'),
  submit: (id: string) =>
    request<{ opportunity: Opportunity }>(`/opportunities/me/${id}/submit`, { method: 'POST' }),
  close: (id: string) =>
    request<{ opportunity: Opportunity }>(`/opportunities/me/${id}/close`, { method: 'POST' }),
}

export const applicationApi = {
  create: (data: ApplicationInput) =>
    request<{ application: Application }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMy: () => request<{ applications: Application[]; pagination: Pagination }>('/applications/my'),
  listAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<{ applications: Application[]; pagination: Pagination }>(
      `/applications${query}`,
    )
  },
  listForOrganization: () =>
    request<{ applications: Application[]; pagination: Pagination }>(
      '/applications/organization/me',
    ),
  updateStatus: (id: string, data: { status: ApplicationStatus; reason?: string }) =>
    request<{ application: Application }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

export const administrationApi = {
  getStats: () =>
    request<{ stats: AdminStats }>('/administration/dashboard/stats'),
  listUsers: (params: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value))
    })
    return request<{ users: AdminUser[]; pagination: AdminPagination }>(
      `/administration/users${query.size ? `?${query}` : ''}`,
    )
  },
  updateUserStatus: (userId: string, status: AdminUser['status']) =>
    request<{ user: Pick<AdminUser, '_id' | 'email' | 'role' | 'status'> }>(
      `/administration/users/${encodeURIComponent(userId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
    ),
  listOrganizations: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value))
    })
    return request<{ organizations: AdminOrganization[]; pagination: AdminPagination }>(
      `/administration/organizations${query.size ? `?${query}` : ''}`,
    )
  },
  listLogs: () => request<{ logs: AdminLog[] }>('/administration/logs'),
  listActivity: () => request<{ activities: AdminActivityEvent[] }>('/administration/activity'),
  listApplications: (params: { page?: number; limit?: number; status?: AdminApplicationStatus } = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value))
    })
    return request<{
      applications: AdminApplication[]
      pagination: AdminPagination
    }>(`/applications${query.size ? `?${query}` : ''}`)
  },
  updateApplicationStatus: (
    applicationId: string,
    status: AdminApplicationStatus,
    reason?: string,
  ) =>
    request<{ application: AdminApplication }>(
      `/applications/${encodeURIComponent(applicationId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, ...(reason ? { reason } : {}) }) },
    ),
}

export const organizationAdminApi = {
  getReview: (organizationId: string) =>
    request<{
      organization: OrganizationReviewProfile
      documents: OrganizationReviewDocument[]
      events: OrganizationReviewEvent[]
    }>(`/organizations/admin/organizations/${encodeURIComponent(organizationId)}`),
  approve: (
    organizationId: string,
    input: {
      registrySource: string
      registryReference: string
      checks: {
        registryRecordFound: true
        legalNameAndNumberMatch: true
        representativeAuthorityConfirmed: true
        independentlySourcedContactConfirmed: true
        documentsAppearAuthentic: true
      }
      note?: string
    },
  ) =>
    request<{ organization: OrganizationReviewProfile }>(
      `/organizations/admin/organizations/${encodeURIComponent(organizationId)}/approve`,
      { method: 'POST', body: JSON.stringify(input) },
    ),
  reject: (organizationId: string, reason: string) =>
    request<{ organization: OrganizationReviewProfile }>(
      `/organizations/admin/organizations/${encodeURIComponent(organizationId)}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),
  suspend: (organizationId: string, reason: string) =>
    request<{ organization: OrganizationReviewProfile }>(
      `/organizations/admin/organizations/${encodeURIComponent(organizationId)}/suspend`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),
  openDocument: async (organizationId: string, documentId: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `${API_BASE}/organizations/admin/organizations/${encodeURIComponent(organizationId)}/documents/${encodeURIComponent(documentId)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    )
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as ApiErrorResponse | undefined
      throw new Error(body?.error?.message || 'Could not open organization document.')
    }
    return URL.createObjectURL(await response.blob())
  },
}

export const opportunityAdminApi = {
  listForReview: (status?: AdminOpportunity['status']) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return request<{ opportunities: AdminOpportunity[] }>(`/opportunities/admin/opportunities${query}`)
  },
  approve: (opportunityId: string, note = '') =>
    request<{ opportunity: AdminOpportunity }>(
      `/opportunities/admin/opportunities/${encodeURIComponent(opportunityId)}/approve`,
      { method: 'POST', body: JSON.stringify({ note }) },
    ),
  reject: (opportunityId: string, reason: string) =>
    request<{ opportunity: AdminOpportunity }>(
      `/opportunities/admin/opportunities/${encodeURIComponent(opportunityId)}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),
  suspend: (opportunityId: string, reason: string) =>
    request<{ opportunity: AdminOpportunity }>(
      `/opportunities/admin/opportunities/${encodeURIComponent(opportunityId)}/suspend`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),
}
