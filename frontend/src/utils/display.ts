import type { Opportunity, OrganizationSummary, StudentSummary } from '../types/domain'

/**
 * The API returns a bare id for references unless the query populated them.
 * These helpers keep the "is it populated?" check in one place so screens can
 * render a sensible fallback instead of `[object Object]` or a crash.
 */

export function getOrganizationName(
  organization: OrganizationSummary | string | null | undefined,
): string {
  if (!organization || typeof organization === 'string') return ''
  return organization.tradingName || organization.legalName || ''
}

export function getStudentName(student: StudentSummary | string | null | undefined): string {
  if (!student || typeof student === 'string') return 'Student'
  return student.fullName || 'Student'
}

export function getOpportunityTitle(
  opportunity: Opportunity | string | null | undefined,
): string {
  if (!opportunity || typeof opportunity === 'string') return 'Opportunity'
  return opportunity.title || 'Opportunity'
}
