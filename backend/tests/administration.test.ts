import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAdministrationDashboardStats } = vi.hoisted(() => ({
  getAdministrationDashboardStats: vi.fn(),
}));

const { AdministrationLog } = vi.hoisted(() => ({
  AdministrationLog: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/modules/administration/models/administration.model.js', () => ({
  AdministrationLog,
}));

vi.mock('../src/modules/administration/services/administration.service.js', () => ({
  getUserManagement: vi.fn(),
  getOrganizationManagement: vi.fn(),
  getAdministrationDashboardStats: vi.fn(),
}));

import { createApp } from '../src/app.js';

const app = createApp();

describe('administration routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdministrationDashboardStats.mockResolvedValue({
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
    AdministrationLog.find.mockResolvedValue([]);
  });

  it('returns user management list with pagination', async () => {
    getUserManagement.mockResolvedValue({
      users: [
        { _id: 'user-1', email: 'student@example.com', role: 'student', status: 'active', createdAt: new Date(), emailVerifiedAt: null },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(getUserManagement).toHaveBeenCalled();
  });

  it('returns organization management list', async () => {
    getOrganizationManagement.mockResolvedValue({
      organizations: [
        { _id: 'org-1', legalName: 'Example Org', verificationStatus: 'verified', verifiedAt: new Date(), createdAt: new Date() },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const response = await request(app)
      .get('/api/v1/administration/organizations')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.organizations).toHaveLength(1);
  });

  it('returns administration dashboard statistics', async () => {
    const response = await request(app)
      .get('/api/v1/administration/dashboard/stats')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.stats.totalStudents).toBe(100);
    expect(response.body.stats.totalOrganizations).toBe(50);
  });

  it('logs an administration action', async () => {
    AdministrationLog.create.mockResolvedValue({ _id: 'log-1', ... });

    const response = await request(app)
      .post('/api/v1/administration/logs')
      .set('Authorization', 'Bearer admin-token')
      .send({
        actorUserId: 'admin-1',
        action: 'organization_approved',
        targetType: 'organization',
        targetId: 'org-1',
        details: { notes: 'All checks passed' },
      });

    expect(response.status).toBe(201);
    expect(AdministrationLog.create).toHaveBeenCalled();
  });

  it('retrieves administration logs', async () => {
    AdministrationLog.find.mockResolvedValue([
      { _id: 'log-1', action: 'organization_approved', createdAt: new Date() },
    ]);

    const response = await request(app)
      .get('/api/v1/administration/logs')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.logs).toHaveLength(1);
  });

  it('updates user status', async () => {
    const mockUser = {
      _id: 'user-1',
      email: 'test@example.com',
      role: 'student',
      status: 'active',
    };
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(mockUser as any);

    const response = await request(app)
      .patch('/api/v1/administration/users/user-1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'suspended' });

    expect(response.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { status: 'suspended' }, expect.anything());
  });

  it('updates organization verification status', async () => {
    const mockOrganization = {
      _id: 'org-1',
      legalName: 'Test Org',
      verificationStatus: 'pending',
      verifiedAt: null,
      rejectionReason: null,
    };
    vi.spyOn(Organization, 'findByIdAndUpdate').mockResolvedValue(mockOrganization as any);

    const response = await request(app)
      .patch('/api/v1/administration/organizations/org-1/verification')
      .set('Authorization', 'Bearer admin-token')
      .send({ verificationStatus: 'verified', notes: 'All checks passed' });

    expect(response.status).toBe(200);
    expect(Organization.findByIdAndUpdate).toHaveBeenCalledWith('org-1', { verificationStatus: 'verified', rejectionReason: null }, expect.anything());
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/v1/administration/users');

    expect(response.status).toBe(401);
    expect(User.find).not.toHaveBeenCalled();
  });

  it('denies non-admin roles', async () => {
    const response = await request(app)
      .get('/api/v1/administration/users')
      .set('Authorization', 'Bearer student-token');

    expect(response.status).toBe(403);
  });
});