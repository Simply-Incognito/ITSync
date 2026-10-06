import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticate, opportunityService } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  opportunityService: {
    approveOpportunity: vi.fn(),
    closeMyOpportunity: vi.fn(),
    createOpportunity: vi.fn(),
    getMyOpportunity: vi.fn(),
    getOpportunityReview: vi.fn(),
    getPublishedOpportunity: vi.fn(),
    listMyOpportunities: vi.fn(),
    listOpportunitiesForReview: vi.fn(),
    listPublishedOpportunities: vi.fn(),
    rejectOpportunity: vi.fn(),
    submitMyOpportunity: vi.fn(),
    suspendOpportunity: vi.fn(),
    updateMyOpportunity: vi.fn(),
  },
}));

vi.mock('../src/modules/identity/services/auth.service.js', () => ({ authenticate }));
vi.mock('../src/modules/organizations/middleware/require-verified-organization.js', () => ({
  requireVerifiedOrganization: (
    request: { organizationId?: string },
    _response: unknown,
    next: () => void,
  ) => {
    request.organizationId = '68d2c50a8c4e1c843a39a202';
    next();
  },
}));
vi.mock('../src/modules/opportunities/services/opportunity.service.js', () => opportunityService);

import { createApp } from '../src/app.js';
import { opportunityCreateSchema } from '../src/modules/opportunities/validations/opportunity.validation.js';

const app = createApp();
const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const validOpportunity = {
  title: 'Software Engineering SIWES Placement',
  description: 'Work with the product engineering team on supervised software projects.',
  fieldOfStudy: 'Computer Science',
  location: { city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
  workArrangement: 'hybrid',
  durationWeeks: 24,
  availableSlots: 4,
  applicationDeadline: deadline,
};

describe('opportunity routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    opportunityService.createOpportunity.mockResolvedValue({
      _id: 'opportunity-1',
      status: 'draft',
    });
    opportunityService.listPublishedOpportunities.mockResolvedValue([]);
    opportunityService.approveOpportunity.mockResolvedValue({
      _id: 'opportunity-1',
      status: 'published',
    });
  });

  it('allows public listing and uses the published-opportunity query', async () => {
    const response = await request(app).get('/api/v1/opportunities');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ opportunities: [] });
    expect(opportunityService.listPublishedOpportunities).toHaveBeenCalledOnce();
  });

  it('allows a verified organization representative to create a draft', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a201',
      email: 'hr@example.test',
      role: 'organization_representative',
    });

    const response = await request(app)
      .post('/api/v1/opportunities/me')
      .set('Authorization', 'Bearer organization-token')
      .send(validOpportunity);

    expect(response.status).toBe(201);
    expect(response.body.opportunity.status).toBe('draft');
    expect(opportunityService.createOpportunity).toHaveBeenCalledWith(
      '68d2c50a8c4e1c843a39a202',
      '68d2c50a8c4e1c843a39a201',
      expect.objectContaining({ title: validOpportunity.title }),
    );
  });

  it('denies students from organization opportunity endpoints', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a203',
      email: 'student@example.test',
      role: 'student',
    });

    const response = await request(app)
      .post('/api/v1/opportunities/me')
      .set('Authorization', 'Bearer student-token')
      .send(validOpportunity);

    expect(response.status).toBe(403);
    expect(opportunityService.createOpportunity).not.toHaveBeenCalled();
  });

  it('allows administrators to approve a pending opportunity', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a204',
      email: 'admin@example.test',
      role: 'administrator',
    });

    const response = await request(app)
      .post('/api/v1/opportunities/admin/opportunities/68d2c50a8c4e1c843a39a205/approve')
      .set('Authorization', 'Bearer admin-token')
      .send({ note: 'Reviewed against the published criteria.' });

    expect(response.status).toBe(200);
    expect(opportunityService.approveOpportunity).toHaveBeenCalledWith(
      '68d2c50a8c4e1c843a39a205',
      '68d2c50a8c4e1c843a39a204',
      'Reviewed against the published criteria.',
    );
  });
});

describe('opportunity validation', () => {
  it('accepts valid opportunity data and rejects expired deadlines or unknown fields', () => {
    expect(opportunityCreateSchema.safeParse(validOpportunity).success).toBe(true);
    expect(
      opportunityCreateSchema.safeParse({ ...validOpportunity, applicationDeadline: '2020-01-01' })
        .success,
    ).toBe(false);
    expect(
      opportunityCreateSchema.safeParse({ ...validOpportunity, status: 'published' }).success,
    ).toBe(false);
  });
});
