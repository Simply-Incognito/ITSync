import type { Types } from 'mongoose';
import { User, type UserRole } from '../../identity/models/user.model.js';
import {
  Organization,
  type OrganizationStatus,
} from '../../organizations/models/organization.model.js';
import {
  Application,
  type ApplicationStatus,
} from '../../applications/models/application.model.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';

export interface UserManagementFilter {
  role?: UserRole | undefined;
  status?: 'active' | 'suspended' | undefined;
  search?: string | undefined;
}

export interface UserManagementResult {
  users: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
    status: 'active' | 'suspended';
    createdAt: Date;
    emailVerifiedAt?: Date | null;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrganizationManagementFilter {
  status?: OrganizationStatus | undefined;
  search?: string | undefined;
}

export interface OrganizationManagementResult {
  organizations: {
    _id: Types.ObjectId;
    legalName: string;
    verificationStatus: OrganizationStatus;
    verifiedAt?: Date | null;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OpportunityModerationFilter {
  status?: ApplicationStatus;
  organizationId?: Types.ObjectId;
}

export interface AdministrationDashboardStats {
  totalStudents: number;
  totalOrganizations: number;
  verifiedOrganizations: number;
  pendingVerification: number;
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  totalOpportunities: number;
  publishedOpportunities: number;
}

export async function getUserManagement(
  filters: UserManagementFilter,
  page: number = 1,
  limit: number = 20,
): Promise<UserManagementResult> {
  const { role, status, search } = filters;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.email = { $regex: search, $options: 'i' };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('email role status emailVerifiedAt createdAt')
      .sort({ email: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrganizationManagement(
  filters: OrganizationManagementFilter,
  page: number = 1,
  limit: number = 20,
): Promise<OrganizationManagementResult> {
  const { status } = filters;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (status) filter.verificationStatus = status;

  const [organizations, total] = await Promise.all([
    Organization.find(filter)
      .select('legalName verificationStatus verifiedAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Organization.countDocuments(filter),
  ]);

  return {
    organizations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAdministrationDashboardStats(): Promise<AdministrationDashboardStats> {
  const [
    totalStudents,
    totalOrganizations,
    verifiedOrganizations,
    pendingVerification,
    totalApplications,
    totalOpportunities,
    publishedOpportunities,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Organization.countDocuments({}),
    Organization.countDocuments({ verificationStatus: 'verified' }),
    Organization.countDocuments({ verificationStatus: 'pending' }),
    Application.countDocuments({}),
    Opportunity.countDocuments({}),
    Opportunity.countDocuments({ status: 'published' }),
  ]);

  const applicationsByStatus = await Application.aggregate<{
    _id: ApplicationStatus;
    count: number;
  }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

  const applicationsByStatusRecord: Record<ApplicationStatus, number> = {
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  } as Record<ApplicationStatus, number>;

  applicationsByStatus.forEach((item) => {
    const status = item._id;
    if (applicationsByStatusRecord[status] !== undefined) {
      applicationsByStatusRecord[status] = item.count;
    }
  });

  return {
    totalStudents,
    totalOrganizations,
    verifiedOrganizations,
    pendingVerification,
    totalApplications,
    applicationsByStatus: applicationsByStatusRecord,
    totalOpportunities,
    publishedOpportunities,
  };
}
