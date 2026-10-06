import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateApplicationStatus } = vi.hoisted(() => ({
  updateApplicationStatus: vi.fn(),
}));

const { Application, applicationStatuses } = vi.hoisted(() => ({
  Application: {
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
  applicationStatuses,
}));

vi.mock('../src/modules/applications/models/application.model.js', () => ({
  Application,
  applicationStatuses,
}));

vi.mock('../src/modules/applications/services/application.service.js', () => ({
  canApplyForOpportunity: vi.fn(),
  createApplication: vi.fn(),
  listApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

import { createApp } from '../src/app.js';
import { updateApplicationStatusSchema } from '../src/modules/applications/validations/application.validation.js';

const app = createApp();

const validTransitionInput = {
  status: 'under_review',
  reason: 'The candidate meets the initial criteria.',
};

describe('application routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Application.findOne.mockResolvedValue(null);
    Application.find.mockResolvedValue({ docs: [], total: 0 });
    Application.countDocuments.mockResolvedValue(0);
    Application.create.mockResolvedValue({ _id: 'app-1', ...validTransitionInput });
    Application.findById.mockResolvedValue({ _id: 'app-1', status: 'submitted' });
    Application.findByIdAndUpdate.mockResolvedValue({ _id: 'app-1', status: 'under_review' });
  });

  it('allows a student to submit an application', async () => {
    const canApplyResult = { canApply: true };
    (vi.mocked(canApplyForOpportunity) as any).mockResolvedValue(canApplyResult);
    createApplication.mockResolvedValue({ _id: 'app-1', status: 'submitted' });

    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer student-token')
      .send({ opportunityId: 'opp-1' });

    expect(response.status).toBe(201);
    expect(canApplyForOpportunity).toHaveBeenCalled();
  });

  it('prevents duplicate applications', async () => {
    Application.findOne.mockResolvedValue({ _id: 'app-1' });

    const response = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', 'Bearer student-token')
      .send({ opportunityId: 'opp-1' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_APPLICATION');
  });

  it('allows a student to view their applications', async () => {
    Application.find.mockResolvedValue({
      docs: [{ _id: 'app-1', status: 'submitted' }],
      total: 1,
    });

    const response = await request(app)
      .get('/api/v1/applications/my')
      .set('Authorization', 'Bearer student-token');

    expect(response.status).toBe(200);
    expect(response.body.applications).toHaveLength(1);
  });

  it('allows an administrator to view all applications', async () => {
    Application.find.mockResolvedValue({
      docs: [{ _id: 'app-1', status: 'submitted' }],
      total: 1,
    });

    const response = await request(app)
      .get('/api/v1/applications')
      .query({ status: 'submitted' })
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(Application.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted' }),
    );
  });

  it('allows an administrator to update application status', async () => {
    Application.findById.mockResolvedValue({ _id: 'app-1', status: 'submitted' });
    Application.findByIdAndUpdate.mockResolvedValue({ _id: 'app-1', status: 'under_review' });

    const response = await request(app)
      .patch('/api/v1/applications/app-1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'under_review', reason: 'Reviewing candidate' });

    expect(response.status).toBe(200);
    expect(Application.findByIdAndUpdate).toHaveBeenCalledWith(
      'app-1',
      { status: 'under_review' },
      expect.anything(),
    );
  });

  it('denies invalid status transitions', async () => {
    Application.findById.mockResolvedValue({ _id: 'app-1', status: 'accepted' });

    const response = await request(app)
      .patch('/api/v1/applications/app-1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'under_review' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_APPLICATION_STATUS_TRANSITION');
  });

  it('requires authentication', async () => {
    const response = await request(app).post('/api/v1/applications');

    expect(response.status).toBe(401);
    expect(Application.create).not.toHaveBeenCalled();
  });
});

describe('application status validation', () => {
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