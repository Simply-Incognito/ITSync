import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authenticate, administrationService } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  administrationService: {
    getUserManagement: vi.fn(),
    getOrganizationManagement: vi.fn(),
    getAdministrationDashboardStats: vi.fn(),
  },
}))

vi.mock('../src/modules/identity/services/auth.service.js', () => ({ authenticate }))
vi.mock('../src/modules/administration/services/administration.service.js', () => administrationService)
vi.mock('../src/modules/administration/models/administration.model.js', () => ({
  AdministrationLog: { find: vi.fn(), create: vi.fn() },
}))

import { createApp } from '../src/app.js'

const app = createApp()

describe('administration routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    administrationService.getUserManagement.mockResolvedValue({
      users: [
        { _id: 'user-1', email: 'student@example.com', role: 'student', status: 'active', createdAt: new Date(), emailVerifiedAt: null },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
    administrationService.getOrganizationManagement.mockResolvedValue({
      organizations: [
        { _id: 'org-1', legalName: 'Example Org', verificationStatus: 'verified', verifiedAt: new Date(), createdAt: new Date() },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
    administrationService.getAdministrationDashboardStats.mockResolvedValue({
      totalStudents: 100,
      totalOrganizations: 50,
      verifiedOrganizations: 30,
      pendingVerification: 10,
      totalApplications: 200,
      applicationsByStatus: {
        submitted: 50,
        under_review: 30,
        shortlisted: 15,
        interview: 10,
        offer: 5,
        accepted: 3,
        rejected: 7,
        withdrawn: 2,
      },
      totalOpportunities: 80,
      publishedOpportunities: 40,
    })
  })

  it('returns user management list with pagination', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a204',
      email: 'admin@example.test',
      role: 'administrator',
    })

    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer admin-token')

    expect(response.status).toBe(200)
    expect(response.body.users).toHaveLength(1)
    expect(administrationService.getUserManagement).toHaveBeenCalled()
  })

  it('returns organization management list', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a204',
      email: 'admin@example.test',
      role: 'administrator',
    })

    const response = await request(app)
      .get('/api/v1/administration/organizations')
      .set('Authorization', 'Bearer admin-token')

    expect(response.status).toBe(200)
    expect(response.body.organizations).toHaveLength(1)
  })

  it('returns administration dashboard statistics', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a204',
      email: 'admin@example.test',
      role: 'administrator',
    })

    const response = await request(app)
      .get('/api/v1/administration/dashboard/stats')
      .set('Authorization', 'Bearer admin-token')

    expect(response.status).toBe(200)
    expect(response.body.stats.totalStudents).toBe(100)
    expect(response.body.stats.totalOrganizations).toBe(50)
  })

  it('requires authentication', async () => {
    const response = await request(app).get('/api/v1/administration/users')

    expect(response.status).toBe(401)
  })

  it('denies non-admin roles', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a203',
      email: 'student@example.test',
      role: 'student',
    })

    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer student-token')

    expect(response.status).toBe(403)
  })
})
