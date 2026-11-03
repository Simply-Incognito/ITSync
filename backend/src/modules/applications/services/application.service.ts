import mongoose, { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { User } from '../../identity/models/user.model.js';
import { Student } from '../../identity/models/student.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';
import { Application, type ApplicationStatus } from '../models/application.model.js';
import { ApplicationReviewEvent } from '../models/application-review-event.model.js';
import { assertStudentVerificationDocuments } from '../../documents/services/document.service.js';

export interface CreateApplicationInput {
  studentId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  studentDocumentIds: Types.ObjectId[];
}

export interface ApplicationFilters {
  status?: ApplicationStatus | undefined;
  studentId?: Types.ObjectId | undefined;
  opportunityId?: Types.ObjectId | undefined;
  page?: number | undefined;
  limit?: number | undefined;
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
  studentId: string,
): Promise<unknown> {
  const { opportunityId, studentDocumentIds } = input;

  // Check if student exists and has a profile
  const student = await Student.findOne({ userId: studentId }).lean();
  if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');
  await assertStudentVerificationDocuments(studentDocumentIds, new Types.ObjectId(studentId));

  const session = await mongoose.startSession();
  let application: InstanceType<typeof Application> | undefined;
  try {
    await session.withTransaction(async () => {
      const opportunity = await Opportunity.findById(opportunityId).session(session).lean();
      if (!opportunity) {
        throw new AppError('Opportunity not found.', 404, 'OPPORTUNITY_NOT_FOUND');
      }

      if (opportunity.status !== 'published') {
        throw new AppError(
          'Only published opportunities can receive applications.',
          409,
          'OPPORTUNITY_NOT_APPLICABLE',
        );
      }

      const organization = await Organization.findById(opportunity.organizationId)
        .session(session)
        .lean();
      if (!organization || organization.verificationStatus !== 'verified') {
        throw new AppError(
          'Only verified organizations can receive applications.',
          403,
          'ORGANIZATION_NOT_VERIFIED',
        );
      }

      const existingApplication = await Application.findOne({
        studentId: student.userId,
        opportunityId,
      })
        .session(session)
        .lean();
      if (existingApplication) {
        throw new AppError(
          'You have already applied to this opportunity.',
          409,
          'DUPLICATE_APPLICATION',
        );
      }

      if (opportunity.applicationDeadline <= new Date()) {
        throw new AppError('The application deadline has passed.', 400, 'APPLICATION_DEADLINE_PASSED');
      }

      const applicationId = new Types.ObjectId();
      application = new Application({
        _id: applicationId,
        studentId: student.userId,
        opportunityId,
        status: 'submitted',
        documents: studentDocumentIds,
      });
      await application.save({ session });

      await ApplicationReviewEvent.create(
        [
          {
            applicationId,
            studentId: student.userId,
            action: 'submitted',
            fromStatus: 'submitted',
            toStatus: 'submitted',
          },
        ],
        { session },
      );
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        'You have already applied to this opportunity.',
        409,
        'DUPLICATE_APPLICATION',
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!application) throw new Error('Application transaction completed without creating an application.');
  return application;
}

export async function listApplications(
  filters: ApplicationFilters,
  userId: string,
): Promise<PaginatedApplications> {
  const { status, studentId, opportunityId, page = 1, limit = 20 } = filters;

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
    const myOrganization = await Organization.findOne({ representativeUserId: userId })
      .select('_id')
      .lean();
    const opportunityIds = myOrganization
      ? await Opportunity.distinct('_id', { organizationId: myOrganization._id })
      : [];
    filter.opportunityId = opportunityId
      ? { $in: opportunityIds.filter((id) => String(id) === String(opportunityId)) }
      : { $in: opportunityIds };
  } else if (userRole.role === 'administrator') {
    // Administrators see all applications
  }

  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (opportunityId && userRole?.role !== 'organization_representative') {
    filter.opportunityId = opportunityId;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('studentId', 'fullName email institution')
      .populate({
        path: 'opportunityId',
        select:
          'title description fieldOfStudy requiredSkills location workArrangement durationWeeks availableSlots applicationDeadline requiredDocuments status createdAt organizationId academicRequirements additionalRequirements',
        populate: {
          path: 'organizationId',
          select: 'legalName tradingName industry description website representativeName representativeTitle address verificationStatus',
        },
      })
      .populate('documents', 'documentType originalName contentType byteSize')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const studentUserIds = applications
    .map((application) => {
      const student = application.studentId as { _id?: Types.ObjectId } | null;
      return student?._id;
    })
    .filter((id): id is Types.ObjectId => Boolean(id));
  const studentProfiles = await Student.find({ userId: { $in: studentUserIds } }).lean();
  const profilesByUserId = new Map(
    studentProfiles.map((profile) => [String(profile.userId), profile]),
  );
  const applicationsWithProfiles = applications.map((application) => {
    const student = application.studentId as { _id?: Types.ObjectId } | null;
    return {
      ...application,
      studentProfile: student?._id
        ? profilesByUserId.get(String(student._id)) ?? null
        : null,
    };
  });

  return {
    applications: applicationsWithProfiles,
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
  const application = await Application.findById(applicationId);
  if (!application) throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');
  const actor = await User.findById(actorUserId).select('role').lean();
  if (!actor) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');

  if (actor.role === 'organization_representative') {
    const organization = await Organization.findOne({ representativeUserId: actorUserId })
      .select('_id')
      .lean();
    if (!organization) {
      throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');
    }
    const opportunity = await Opportunity.findOne({
      _id: application.opportunityId,
      organizationId: organization._id,
    })
      .select('_id')
      .lean();
    if (!opportunity) {
      throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');
    }
  } else if (actor.role !== 'administrator') {
    throw new AppError('You are not allowed to review this application.', 403, 'FORBIDDEN');
  }

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
  const organizationDecision =
    actor.role === 'organization_representative' &&
    (newStatus === 'accepted' || newStatus === 'rejected') &&
    !['accepted', 'rejected', 'withdrawn'].includes(currentStatus);
  if (!organizationDecision && !validTransitions[currentStatus]?.includes(newStatus)) {
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
