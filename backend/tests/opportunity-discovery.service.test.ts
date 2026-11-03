import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { applicationModel, opportunityModel, organizationModel } = vi.hoisted(() => ({
  applicationModel: { aggregate: vi.fn() },
  opportunityModel: { find: vi.fn(), countDocuments: vi.fn() },
  organizationModel: { distinct: vi.fn() },
}));

vi.mock('../src/modules/applications/models/application.model.js', () => ({
  Application: applicationModel,
}));
vi.mock('../src/modules/opportunities/models/opportunity.model.js', () => ({
  Opportunity: opportunityModel,
}));
vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: organizationModel,
}));

import { searchOpportunities } from '../src/modules/opportunities/services/opportunity-discovery.service.js';

describe('opportunity discovery application counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes the number of submitted applications on every opportunity', async () => {
    const firstId = new Types.ObjectId();
    const secondId = new Types.ObjectId();
    organizationModel.distinct.mockResolvedValue([]);
    opportunityModel.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: firstId }, { _id: secondId }]),
    });
    opportunityModel.countDocuments.mockResolvedValue(2);
    applicationModel.aggregate.mockResolvedValue([{ _id: firstId, count: 21 }]);

    const result = await searchOpportunities({});

    expect(result.opportunities).toEqual([
      { _id: firstId, applicationsCount: 21 },
      { _id: secondId, applicationsCount: 0 },
    ]);
    expect(applicationModel.aggregate).toHaveBeenCalledWith([
      { $match: { opportunityId: { $in: [firstId, secondId] } } },
      { $group: { _id: '$opportunityId', count: { $sum: 1 } } },
    ]);
  });
});
