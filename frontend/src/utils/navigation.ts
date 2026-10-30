import type { User } from '../types/domain'

export function getDashboardPath(role: User['role']): string {
  if (role === 'student') return '/student/dashboard'
  if (role === 'organization_representative') return '/organization/dashboard'
  return '/admin/dashboard'
}
