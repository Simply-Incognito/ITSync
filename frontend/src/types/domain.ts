/**
 * Domain types shared by the API client and the screens that consume it.
 *
 * These mirror the JSON the backend returns for public resources. Populated
 * references are modelled as `string | <Summary>` because a field is a bare id
 * unless the query asked Mongo to populate it.
 */

export type UserRole = 'student' | 'organization_representative' | 'administrator'
export type UserStatus = 'active' | 'suspended'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  emailVerifiedAt?: string | null
}

export interface StudentProfile {
  _id: string
  fullName: string
  phoneNumber?: string | null
  institution?: string | null
  matricNumber?: string | null
  department?: string | null
  fieldOfStudy?: string | null
  currentLevel?: string | null
  expectedDurationWeeks?: number | null
  preferredLocations?: string[]
  skills?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface StudentProfileInput {
  fullName: string
  phoneNumber?: string
  institution?: string
  matricNumber?: string
  department?: string
  fieldOfStudy?: string
  currentLevel?: string
  expectedDurationWeeks?: number
  preferredLocations?: string[]
  skills?: string[]
}

export interface OrganizationAddress {
  street: string
  city: string
  state: string
  country: string
  postalCode?: string | null
}

export type OrganizationStatus = 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended'

export interface Organization {
  _id: string
  legalName: string
  tradingName?: string | null
  registrationCountry: string
  registrationNumber: string
  industry: string
  description: string
  website?: string | null
  address: OrganizationAddress
  representativeName: string
  representativeTitle: string
  representativeUserId: string
  verificationStatus: OrganizationStatus
  verifiedAt?: string | null
  rejectionReason?: string | null
  suspensionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface OrganizationProfileInput {
  legalName: string
  tradingName?: string
  registrationCountry?: string
  registrationNumber: string
  industry: string
  description: string
  website?: string
  representativeName: string
  representativeTitle: string
  address: OrganizationAddress
}

export type OrganizationDocumentType =
  | 'cac_certificate'
  | 'cac_status_report'
  | 'representative_authorization'
  | 'proof_of_address'
  | 'other'

export interface OrganizationDocument {
  id: string
  documentType: OrganizationDocumentType
  originalName: string
  contentType: string
  byteSize: number
  uploadedAt: string
}

export type WorkArrangement = 'onsite' | 'hybrid' | 'remote'

export interface OpportunityLocation {
  city: string
  state: string
  country: string
}

export type OpportunityStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'closed'
  | 'suspended'

/** The organization fields embedded in a populated opportunity. */
export interface OrganizationSummary {
  _id: string
  legalName: string
  tradingName?: string | null
  industry?: string
  website?: string | null
  address?: OrganizationAddress
}

export interface Opportunity {
  _id: string
  organizationId: string | OrganizationSummary | null
  createdBy?: string
  title: string
  description: string
  fieldOfStudy: string
  imageKey?: string
  requiredSkills: string[]
  academicRequirements?: string
  location: OpportunityLocation
  workArrangement: WorkArrangement
  durationWeeks: number
  availableSlots: number
  applicationDeadline: string
  requiredDocuments: string[]
  additionalRequirements?: string
  status: OpportunityStatus
  publishedAt?: string | null
  reviewNote?: string | null
  createdAt: string
  updatedAt?: string
}

export interface OpportunityInput {
  title: string
  description: string
  fieldOfStudy: string
  imageKey?: string
  requiredSkills?: string[]
  academicRequirements?: string
  location: OpportunityLocation
  workArrangement: WorkArrangement
  durationWeeks: number
  availableSlots: number
  applicationDeadline: string
  requiredDocuments?: string[]
  additionalRequirements?: string
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface StudentSummary {
  _id: string
  fullName?: string
  email?: string
  institution?: string
}

export interface Application {
  _id: string
  studentId: string | StudentSummary
  opportunityId: string | Opportunity
  status: ApplicationStatus
  rejectionReason?: string | null
  documents?: StudentDocumentSummary[]
  createdAt: string
  updatedAt?: string
}

export interface ApplicationInput {
  opportunityId: string
  studentDocumentIds: string[]
}

export type StudentVerificationDocumentType = 'student_id' | 'biodata'

export interface StudentDocumentSummary {
  _id: string
  documentType: StudentVerificationDocumentType
  originalName: string
  contentType: string
  byteSize: number
}

export interface UploadedStudentDocument {
  documentType: StudentVerificationDocumentType
  originalName: string
  contentType: string
  byteSize: number
  documentId: string
  storageId: string
  sha256: string
  uploadedBy: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface OpportunityFilters {
  fieldOfStudies: string[]
  locations: string[]
  industries: string[]
}

export interface RegistrationCredentials {
  email: string
  password: string
  confirmPassword: string
}

export type RegisterData = RegistrationCredentials &
  (
    | { role: 'student'; student: StudentProfileInput }
    | { role: 'organization_representative'; organization: OrganizationProfileInput }
  )
