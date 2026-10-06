import { Types } from 'mongoose';
import { Organization } from '../../organizations/models/organization.model.js';
import { Opportunity } from '../models/opportunity.model.js';

export interface OpportunitySearchFilters {
  search?: string;
  fieldOfStudy?: string;
  industry?: string;
  location?: string;
  durationWeeks?: number;
  workArrangement?: 'onsite' | 'hybrid' | 'remote';
  page?: number;
  limit?: number;
}

export interface PaginatedOpportunities {
  opportunities: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function searchOpportunities(
  filters: OpportunitySearchFilters,
): Promise<PaginatedOpportunities> {
  const {
    search,
    fieldOfStudy,
    industry,
    location,
    durationWeeks,
    workArrangement,
    page = 1,
    limit = 20,
  } = filters;

  const verifiedOrganizationIds = await Organization.distinct('_id', {
    verificationStatus: 'verified',
  });

  const query: Record<string, unknown> = {
    organizationId: { $in: verifiedOrganizationIds },
    status: 'published',
    applicationDeadline: { $gt: new Date() },
  };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { fieldOfStudy: { $regex: search, $options: 'i' } },
    ];
  }

  if (fieldOfStudy) {
    query.fieldOfStudy = { $regex: fieldOfStudy, $options: 'i' };
  }

  if (location) {
    query.$or = [
      { 'location.city': { $regex: location, $options: 'i' } },
      { 'location.state': { $regex: location, $options: 'i' } },
      { 'location.country': { $regex: location, $options: 'i' } },
    ];
  }

  if (durationWeeks) {
    query.durationWeeks = durationWeeks;
  }

  if (workArrangement) {
    query.workArrangement = workArrangement;
  }

  if (industry) {
    const orgIds = await Organization.distinct('_id', {
      verificationStatus: 'verified',
      industry: { $regex: industry, $options: 'i' },
    });
    query.organizationId = { $in: orgIds };
  }

  const skip = (page - 1) * limit;

  const [opportunities, total] = await Promise.all([
    Opportunity.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizationId', 'legalName tradingName industry address website')
      .lean(),
    Opportunity.countDocuments(query),
  ]);

  return {
    opportunities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOpportunityFilters() {
  const verifiedOrganizationIds = await Organization.distinct('_id', {
    verificationStatus: 'verified',
  });

  const [fieldOfStudies, locations, industries] = await Promise.all([
    Opportunity.distinct('fieldOfStudy', {
      organizationId: { $in: verifiedOrganizationIds },
      status: 'published',
      applicationDeadline: { $gt: new Date() },
    }),
    Opportunity.aggregate([
      {
        $match: {
          organizationId: { $in: verifiedOrganizationIds.map((id) => new Types.ObjectId(id)) },
          status: 'published',
          applicationDeadline: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: '$location.state',
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Organization.distinct('industry', { verificationStatus: 'verified' }),
  ]);

  return {
    fieldOfStudies,
    locations: locations.map((doc) => doc._id),
    industries,
  };
}
