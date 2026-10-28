import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticate, administrationService, administrationLogSave, AdministrationLog } =
  vi.hoisted(() => {
    const administrationLogSave = vi.fn();

    class MockAdministrationLog {
      static find = vi.fn();

      save = administrationLogSave;

      constructor(fields: Record<string, unknown>) {
        Object.assign(this, fields);
      }
    }

    return {
      authenticate: vi.fn(),
      administrationService: {
        getUserManagement: vi.fn(),
        getOrganizationManagement: vi.fn(),
        getAdministrationDashboardStats: vi.fn(),
      },
      administrationLogSave,
      AdministrationLog: MockAdministrationLog,
    };
  });

vi.mock('../src/modules/identity/services/auth.service.js', () => ({ authenticate }));
vi.mock('../src/modules/administration/services/administration.service.js', () => ({
  ...administrationService,
}));
vi.mock('../src/modules/administration/models/administration.model.js', () => ({
  AdministrationLog,
}));

import { createApp } from '../src/app.js';

const app = createApp();

const administrator = {
  id: '68d2c50a8c4e1c843a39a204',
  email: 'admin@example.test',
  role: 'administrator',
} as const;

describe('administration routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticate.mockResolvedValue(administrator);
    administrationService.getUserManagement.mockResolvedValue({
      users: [
        {
          _id: 'user-1',
          email: 'student@example.com',
          role: 'student',
          status: 'active',
          createdAt: new Date(),
          emailVerifiedAt: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    administrationService.getOrganizationManagement.mockResolvedValue({
      organizations: [
        {
          _id: 'org-1',
          legalName: 'Example Org',
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          createdAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
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
    });
    administrationLogSave.mockResolvedValue(undefined);
    AdministrationLog.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });
  });

  it('returns user management list with pagination', async () => {
    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(administrationService.getUserManagement).toHaveBeenCalled();
  });

  it('returns organization management list', async () => {
    const response = await request(app)
      .get('/api/v1/administration/organizations')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.organizations).toHaveLength(1);
    expect(administrationService.getOrganizationManagement).toHaveBeenCalled();
  });

  it('returns administration dashboard statistics', async () => {
    const response = await request(app)
      .get('/api/v1/administration/dashboard/stats')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.stats.totalStudents).toBe(100);
    expect(response.body.stats.totalOrganizations).toBe(50);
  });

  it('logs an administration action', async () => {
    const response = await request(app)
      .post('/api/v1/administration/logs')
      .set('Authorization', 'Bearer test-token')
      .send({
        actorUserId: administrator.id,
        action: 'organization_approved',
        targetType: 'organization',
        targetId: '68d2c50a8c4e1c843a39a205',
        details: { notes: 'All checks passed' },
      });

    expect(response.status).toBe(201);
    expect(administrationLogSave).toHaveBeenCalledOnce();
  });

  it('retrieves administration logs', async () => {
    const lean = vi.fn().mockResolvedValue([
      { _id: 'log-1', action: 'organization_approved', createdAt: new Date() },
    ]);
    AdministrationLog.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean,
    });

    const response = await request(app)
      .get('/api/v1/administration/logs')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.logs).toHaveLength(1);
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/v1/administration/users');

    expect(response.status).toBe(401);
    expect(administrationService.getUserManagement).not.toHaveBeenCalled();
  });

  it('denies non-admin roles', async () => {
    authenticate.mockResolvedValue({
      ...administrator,
      role: 'student',
    });

    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(administrationService.getUserManagement).not.toHaveBeenCalled();
  });
});
