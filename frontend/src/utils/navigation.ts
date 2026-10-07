import type { User } from '../context/AuthContext'

export function getDashboardPath(role: User['role']): string {
  if (role === 'student') return '/student/dashboard'
  if (role === 'organization_representative') return '/organization/dashboard'
  return '/'
}
