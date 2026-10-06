import mongoose, { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { User, type UserRole } from '../../identity/models/user.model.js';
import { Student } from '../../identity/models/student.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import { Opportunity } from '../models/opportunity.model.js';
import { ApplicationStatus } from '../models/application.model.js';
import { ApplicationReviewEvent } from '../models/application-review-event.model.js';

export interface CreateApplicationInput {
  studentId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  studentDocumentIds?: Types.ObjectId[];
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  studentId?: Types.ObjectId;
  opportunityId?: Types.ObjectId;
  page?: number;
  limit?: number;
}

export interface PaginatedApplications {
  applications: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function canApplyForOpportunity(
  studentId: Types.ObjectId,
  opportunityId: Types.ObjectId,
): Promise<boolean> {
  const student = await Student.findOne({ userId: studentId }).lean();
  if (!student) return false;

  const opportunity = await Opportunity.findById(opportunityId).lean();
  if (!opportunity) return false;

  // Check if student already applied
  const existingApplication = await Application.findOne({
    studentId,
    opportunityId,
  }).lean();
  if (existingApplication) return false;

  // Check if slots are still available
  if (opportunity.availableSlots <= 0) return false;

  // Check if application deadline hasn't passed
  if (opportunity.applicationDeadline <= new Date()) return false;

  // Check if opportunity is published and organization is verified
  if (opportunity.status !== 'published') return false;

  const organization = await Organization.findById(opportunity.organizationId).lean();
  if (!organization || organization.verificationStatus !== 'verified') return false;

  return true;
}

export async function createApplication(
  input: CreateApplicationInput,
  studentId: Types.ObjectId,
): Promise<unknown> {
  const { studentId: _, opportunityId, studentDocumentIds } = input;

  // Check if student exists and has a profile
  const student = await Student.findOne({ userId: studentId }).lean();
  if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');

  // Check if opportunity exists and is available
  const opportunity = await Opportunity.findById(opportunityId).lean();
  if (!opportunity) throw new AppError('Opportunity not found.', 404, 'OPPORTUNITY_NOT_FOUND');

  if (opportunity.status !== 'published') {
    throw new AppError(
      'Only published opportunities can receive applications.',
      409,
      'OPPORTUNITY_NOT_APPLICABLE',
    );
  }

  // Check verification status of organization
  const organization = await Organization.findById(opportunity.organizationId).lean();
  if (!organization || organization.verificationStatus !== 'verified') {
    throw new AppError(
      'Only verified organizations can receive applications.',
      403,
      'ORGANIZATION_NOT_VERIFIED',
    );
  }

  // Check if student already applied
  const existingApplication = await Application.findOne({
    studentId: student.userId,
    opportunityId,
  }).lean();
  if (existingApplication) {
    throw new AppError(
      'You have already applied to this opportunity.',
      409,
      'DUPLICATE_APPLICATION',
    );
  }

  // Check if slots are still available
  if (opportunity.availableSlots <= 0) {
    throw new AppError(
      'No available slots for this opportunity.',
      409,
      'NO_AVAILABLE_SLOTS',
    );
  }

  // Check if application deadline hasn't passed
  if (opportunity.applicationDeadline <= new Date()) {
    throw new AppError(
      'The application deadline has passed.',
      400,
      'APPLICATION_DEADLINE_PASSED',
    );
  }

  // Create the application
  const applicationId = new Types.ObjectId();
  const application = new Application({
    _id: applicationId,
    studentId: student.userId,
    opportunityId,
    status: 'submitted',
    documents: studentDocumentIds || [],
  });

  await application.save();

  // Update opportunity's available slots
  opportunity.availableSlots -= 1;
  await opportunity.save();

  // Create review event
  await ApplicationReviewEvent.create({
    applicationId,
    studentId: student.userId,
    action: 'submitted',
    fromStatus: 'submitted',
    toStatus: 'submitted',
  });

  return application;
}

export async function listApplications(
  filters: ApplicationFilters,
  userId: string,
): Promise<PaginatedApplications> {
  const {
    status,
    studentId,
    opportunityId,
    page = 1,
    limit = 20,
  } = filters;

  const filter: Record<string, unknown> = {};

  // Role-based filtering
  const userRole = await User.findById(userId).select('role').lean();
  if (!userRole) {
    filter.studentId = studentId;
    filter.opportunityId = opportunityId;
  } else if (userRole.role === 'student') {
    // Students can only see their own applications
    filter.studentId = studentId || userId;
  } else if (userRole.role === 'organization_representative') {
    // Organization reps see applications for their opportunities
    if (!opportunityId) {
      const myOrganizations = await Organization.findOne({
        representativeUserId: userId,
      }).select('_id').lean();
      if (myOrganizations) {
        const oppIds = await Opportunity.distinct('_id', {
          organizationId: myOrganizations._id,
        });
        filter.opportunityId = { $in: oppIds };
      } else {
        filter.opportunityId = undefined;
      }
    }
  } else if (userRole.role === 'administrator') {
    // Administrators see all applications
  }

  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (opportunityId) filter.opportunityId = opportunityId;

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('studentId', 'fullName email institution')
      .populate('opportunityId', 'title organizationId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateApplicationStatus(
  applicationId: Types.ObjectId,
  newStatus: ApplicationStatus,
  actorUserId: string,
  reason?: string,
): Promise<unknown> {
  const application = await Application.findById(applicationId).lean();
  if (!application) throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');

  // Define valid transitions
  const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    submitted: ['under_review', 'rejected', 'withdrawn'],
    under_review: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['interview', 'rejected', 'withdrawn'],
    interview: ['offer', 'rejected', 'withdrawn'],
    offer: ['accepted', 'rejected'],
    accepted: [], // terminal
    rejected: [], // terminal
    withdrawn: [], // terminal
  };

  const currentStatus = application.status as ApplicationStatus;
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${currentStatus}" to "${newStatus}".`,
      409,
      'INVALID_APPLICATION_STATUS_TRANSITION',
    );
  }

  // If the offer is being accepted, no need to change status further
  if (newStatus === 'accepted') {
    application.status = 'accepted';
    await application.save();

    // Create review event
    await ApplicationReviewEvent.create({
      applicationId: application._id,
      actorUserId,
      action: 'accepted',
      fromStatus: currentStatus,
      toStatus: 'accepted',
    });

    return application;
  }

  application.status = newStatus;
  if (reason && newStatus !== 'rejected') {
    application.rejectionReason = reason;
  } else if (reason && newStatus === 'rejected') {
    application.rejectionReason = reason;
  }
  await application.save();

  // Create review event
  await ApplicationReviewEvent.create({
    applicationId: application._id,
    actorUserId,
    action: newStatus,
    fromStatus: currentStatus,
    toStatus: newStatus,
    note: reason,
  });

  return application;
}