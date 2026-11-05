import { AppError } from '../../../errors/app-error.js';
import { Application } from '../../applications/models/application.model.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';
import { Organization } from '../../organizations/models/organization.model.js';

export interface StudentDashboardData {
  activeApplications: unknown[];
  applicationCount: number;
}

export interface OrganizationDashboardData {
  openOpportunities: number;
  applicantCounts: Record<string, number>;
  recentApplications: unknown[];
  availableSlots: Record<string, number>;
}

export async function getStudentDashboard(identity: { id: string; role: string }) {
  const userId = identity.id;

  if (identity.role !== 'student') {
    throw new AppError(
      'Application tracking is only available to students.',
      403,
      'ROLE_FORBIDDEN',
    );
  }

  const [applications, applicationCount] = await Promise.all([
    Application.find({ studentId: userId })
      .populate('opportunityId', 'title fieldOfStudy location status availableSlots')
      .populate('opportunityId.organizationId', 'legalName industry')
      .sort({ createdAt: -1 })
      .lean(),
    Application.countDocuments({ studentId: userId }),
  ]);

  return {
    activeApplications: applications,
    applicationCount,
  };
}

export async function getOrganizationDashboard(
  representativeUserId: string,
  identity: { id: string; role: string },
) {
  if (identity.role !== 'organization_representative') {
    throw new AppError(
      'Application tracking is only available to organization representatives.',
      403,
      'ROLE_FORBIDDEN',
    );
  }

  // Find the organization for this representative
  const organization = await Organization.findOne({ representativeUserId }).lean();
  if (!organization) {
    return {
      openOpportunities: 0,
      applicantCounts: {},
      recentApplications: [],
      availableSlots: {},
    };
  }

  // Get opportunities for this organization
  const opportunities = await Opportunity.find({ organizationId: organization._id }).lean();

  // Get applicant counts per opportunity
  const applicantCounts: Record<string, number> = {};
  const opportunityIds = opportunities.map((opp) => opp._id);

  if (opportunityIds.length > 0) {
    const applicantResults = await Application.aggregate([
      { $match: { opportunityId: { $in: opportunityIds } } },
      { $group: { _id: '$opportunityId', count: { $sum: 1 } } },
    ]);

    applicantResults.forEach((result) => {
      applicantCounts[result._id.toString()] = result.count;
    });
  }

  // Get recent applications with student and opportunity details
  const recentApplications = await Application.find({ opportunityId: { $in: opportunityIds } })
    .populate('studentId', 'fullName email institution')
    .populate('opportunityId', 'title')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get available slots per opportunity
  const availableSlots: Record<string, number> = {};
  opportunities.forEach((opp) => {
    availableSlots[opp._id.toString()] = opp.availableSlots;
  });

  return {
    openOpportunities: opportunities.length,
    applicantCounts,
    recentApplications,
    availableSlots,
  };
}
