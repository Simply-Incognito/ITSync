import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchOpportunities, getOpportunityFilters } = vi.hoisted(() => ({
  searchOpportunities: vi.fn(),
  getOpportunityFilters: vi.fn(),
}));

vi.mock('../src/modules/opportunities/services/opportunity-discovery.service.js', () => ({
  searchOpportunities,
  getOpportunityFilters,
}));

import { createApp } from '../src/app.js';
import { opportunitySearchSchema } from '../src/modules/opportunities/validations/opportunity-discovery.validation.js';

const app = createApp();

describe('opportunity discovery routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchOpportunities.mockResolvedValue({
      opportunities: [{ _id: 'opp-1', title: 'Software Engineering SIWES' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    getOpportunityFilters.mockResolvedValue({
      fieldOfStudies: ['Computer Science', 'Electrical Engineering'],
      locations: ['Lagos', 'Abuja'],
      industries: ['Technology', 'Finance'],
    });
  });

  it('returns paginated opportunities with default filters', async () => {
    const response = await request(app).get('/api/v1/opportunities');

    expect(response.status).toBe(200);
    expect(response.body.opportunities).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(searchOpportunities).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('passes search and filter parameters to the service', async () => {
    const response = await request(app)
      .get('/api/v1/opportunities')
      .query({
        search: 'software',
        fieldOfStudy: 'Computer Science',
        location: 'Lagos',
        durationWeeks: 24,
        workArrangement: 'hybrid',
        page: 2,
        limit: 10,
      });

    expect(response.status).toBe(200);
    expect(searchOpportunities).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'software',
        fieldOfStudy: 'Computer Science',
        location: 'Lagos',
        durationWeeks: 24,
        workArrangement: 'hybrid',
        page: 2,
        limit: 10,
      }),
    );
  });

  it('returns available filter options', async () => {
    const response = await request(app).get('/api/v1/opportunities/filters');

    expect(response.status).toBe(200);
    expect(response.body.filters).toMatchObject({
      fieldOfStudies: ['Computer Science', 'Electrical Engineering'],
      locations: ['Lagos', 'Abuja'],
      industries: ['Technology', 'Finance'],
    });
    expect(getOpportunityFilters).toHaveBeenCalledOnce();
  });

  it('rejects invalid query parameters', async () => {
    const response = await request(app)
      .get('/api/v1/opportunities')
      .query({ durationWeeks: 'invalid', workArrangement: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('opportunity search validation', () => {
  it('accepts valid search parameters', () => {
    const result = opportunitySearchSchema.safeParse({
      search: 'software',
      fieldOfStudy: 'Computer Science',
      location: 'Lagos',
      durationWeeks: 24,
      workArrangement: 'hybrid',
      page: 1,
      limit: 20,
    });
    expect(result.success).toBe(true);
  });

  it('applies default values for pagination', () => {
    const result = opportunitySearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects invalid work arrangement', () => {
    const result = opportunitySearchSchema.safeParse({ workArrangement: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pagination values', () => {
    expect(opportunitySearchSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(opportunitySearchSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(opportunitySearchSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
