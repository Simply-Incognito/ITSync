import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/errors/app-error.js';
import type * as AuthService from '../src/modules/identity/services/auth.service.js';

const { authenticate, applicationService } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  applicationService: {
    canApplyForOpportunity: vi.fn(),
    createApplication: vi.fn(),
    listApplications: vi.fn(),
    updateApplicationStatus: vi.fn(),
  },
}));

vi.mock('../src/modules/identity/services/auth.service.js', async () => {
  const actual = await vi.importActual<typeof AuthService>(
    '../src/modules/identity/services/auth.service.js',
  );

  return { ...actual, authenticate };
});

vi.mock('../src/modules/applications/services/application.service.js', () => applicationService);

import { createApp } from '../src/app.js';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from '../src/modules/applications/validations/application.validation.js';

const app = createApp();

const studentId = '68d2c50a8c4e1c843a39a201';
const adminId = '68d2c50a8c4e1c843a39a204';
const opportunityId = '68d2c50a8c4e1c843a39a205';
const applicationId = '68d2c50a8c4e1c843a39a206';
const studentDocumentId = '68d2c50a8c4e1c843a39a207';

const studentIdentity = { id: studentId, email: 'student@example.test', role: 'student' };
const adminIdentity = { id: adminId, email: 'admin@example.test', role: 'administrator' };

describe('application routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticate.mockResolvedValue(studentIdentity);
    applicationService.createApplication.mockResolvedValue({
      _id: applicationId,
      status: 'submitted',
    });
    applicationService.listApplications.mockResolvedValue({
      applications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    applicationService.updateApplicationStatus.mockResolvedValue({
      _id: applicationId,
      status: 'under_review',
    });
  });

  it('allows a student to submit an application', async () => {
    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer student-token')
      .send({ opportunityId, studentDocumentIds: [studentDocumentId] });

    expect(response.status).toBe(201);
    expect(applicationService.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: expect.any(Types.ObjectId),
        opportunityId: expect.any(Types.ObjectId),
        studentDocumentIds: [expect.any(Types.ObjectId)],
      }),
      studentId,
    );
  });

  it('rejects an invalid opportunity id', async () => {
    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer student-token')
      .send({
        opportunityId: 'not-an-object-id',
        studentDocumentIds: [studentDocumentId],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OPPORTUNITY_ID');
  });

  it('requires a student ID or biodata document to apply', async () => {
    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer test-token')
      .send({ opportunityId });

    expect(response.status).toBe(400);
    expect(applicationService.createApplication).not.toHaveBeenCalled();
  });

  it('prevents duplicate applications', async () => {
    applicationService.createApplication.mockRejectedValue(
      new AppError('You have already applied to this opportunity.', 409, 'DUPLICATE_APPLICATION'),
    );

    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer student-token')
      .send({ opportunityId, studentDocumentIds: [studentDocumentId] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_APPLICATION');
  });

  it('allows a student to view their applications', async () => {
    applicationService.listApplications.mockResolvedValue({
      applications: [{ _id: applicationId, status: 'submitted' }],
      pagination: { page: 2, limit: 100, total: 101, totalPages: 2 },
    });

    const response = await request(app)
      .get('/api/v1/applications/my')
      .query({ page: '2', limit: '100' })
      .set('Authorization', 'Bearer student-token');

    expect(response.status).toBe(200);
    expect(response.body.applications).toHaveLength(1);
    expect(applicationService.listApplications).toHaveBeenCalledWith(
      { studentId: expect.any(Types.ObjectId), page: 2, limit: 100 },
      studentId,
    );
  });

  it('allows an administrator to view all applications', async () => {
    authenticate.mockResolvedValue(adminIdentity);

    const response = await request(app)
      .get('/api/v1/applications')
      .query({ status: 'submitted', page: '2', limit: '5' })
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(applicationService.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted', page: 2, limit: 5 }),
      adminId,
    );
  });

  it('rejects invalid application filters and pagination', async () => {
    authenticate.mockResolvedValue(adminIdentity);

    const invalidStatus = await request(app)
      .get('/api/v1/applications')
      .query({ status: 'invalid' })
      .set('Authorization', 'Bearer test-token');
    const invalidLimit = await request(app)
      .get('/api/v1/applications')
      .query({ limit: '101' })
      .set('Authorization', 'Bearer test-token');

    expect(invalidStatus.status).toBe(400);
    expect(invalidStatus.body.error.code).toBe('INVALID_APPLICATION_STATUS');
    expect(invalidLimit.status).toBe(400);
    expect(invalidLimit.body.error.code).toBe('INVALID_PAGINATION');
  });

  it('allows an administrator to update application status', async () => {
    authenticate.mockResolvedValue(adminIdentity);

    const response = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'under_review', reason: 'Reviewing candidate' });

    expect(response.status).toBe(200);
    expect(applicationService.updateApplicationStatus).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      'under_review',
      adminId,
      'Reviewing candidate',
    );
  });

  it('denies invalid status transitions', async () => {
    authenticate.mockResolvedValue(adminIdentity);
    applicationService.updateApplicationStatus.mockRejectedValue(
      new AppError(
        'Cannot transition from "accepted" to "under_review".',
        409,
        'INVALID_APPLICATION_STATUS_TRANSITION',
      ),
    );

    const response = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'under_review' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_APPLICATION_STATUS_TRANSITION');
  });

  it('requires authentication', async () => {
    const response = await request(app).post('/api/v1/applications').send({ opportunityId });

    expect(response.status).toBe(401);
    expect(applicationService.createApplication).not.toHaveBeenCalled();
  });
});

describe('application status validation', () => {
  it('requires exactly one verification document for an application', () => {
    expect(
      createApplicationSchema.safeParse({
        opportunityId,
        studentDocumentIds: [studentDocumentId],
      }).success,
    ).toBe(true);
    expect(createApplicationSchema.safeParse({ opportunityId }).success).toBe(false);
    expect(
      createApplicationSchema.safeParse({
        opportunityId,
        studentDocumentIds: [studentDocumentId, studentDocumentId],
      }).success,
    ).toBe(false);
  });

  it('accepts valid status transitions', () => {
    const result = updateApplicationStatusSchema.safeParse({
      status: 'under_review',
      reason: 'Reviewing candidate',
    });
    expect(result.success).toBe(true);
  });

  it('requires reason for rejected status', () => {
    const result = updateApplicationStatusSchema.safeParse({
      status: 'rejected',
    });
    expect(result.success).toBe(false);
  });

  it('allows status without reason for non-rejected', () => {
    const result = updateApplicationStatusSchema.safeParse({
      status: 'under_review',
    });
    expect(result.success).toBe(true);
  });
});
