import type { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { Application } from '../../applications/models/application.model.js';
import { Student } from '../../identity/models/student.model.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import {
  Notification as NotificationModel,
  type NotificationDocument,
  type NotificationType,
} from '../models/notification.model.js';

export type NotificationRecord = NotificationDocument;

export interface NotificationFilters {
  recipientId?: Types.ObjectId | undefined;
  recipientRole?: 'student' | 'organization_representative' | 'administrator' | undefined;
  type?: NotificationType | undefined;
  read?: boolean | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface PaginatedNotifications {
  notifications: NotificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type RecipientRole = 'student' | 'organization_representative' | 'administrator';
type RelatedEntityType = 'application' | 'opportunity' | 'organization';

function notFound(message: string, code: string) {
  return new AppError(message, 404, code);
}

export async function createNotification(
  recipientId: Types.ObjectId,
  recipientRole: RecipientRole,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityId?: Types.ObjectId,
  relatedEntityType?: RelatedEntityType,
): Promise<NotificationRecord> {
  const notification = await NotificationModel.create({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    read: false,
    ...(relatedEntityId ? { relatedEntityId } : {}),
    ...(relatedEntityType ? { relatedEntityType } : {}),
  });

  return notification.toObject() as unknown as NotificationRecord;
}

export async function getNotifications(
  filters: NotificationFilters,
): Promise<PaginatedNotifications> {
  const { recipientId, recipientRole, type, read, page = 1, limit = 20 } = filters;

  const filter: Record<string, unknown> = {};

  if (recipientId) filter.recipientId = recipientId;
  if (recipientRole) filter.recipientRole = recipientRole;
  if (type) filter.type = type;
  if (read !== undefined) filter.read = read;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationModel.countDocuments(filter),
  ]);

  return {
    notifications: notifications as unknown as NotificationRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationAsRead(
  notificationId: Types.ObjectId,
): Promise<NotificationRecord> {
  const notification = await NotificationModel.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: new Date() },
    { new: true, runValidators: true },
  ).lean();

  if (!notification) {
    throw notFound('Notification was not found.', 'NOTIFICATION_NOT_FOUND');
  }

  return notification as unknown as NotificationRecord;
}

export async function markAllNotificationsAsRead(
  recipientId: Types.ObjectId,
  recipientRole: RecipientRole,
): Promise<void> {
  await NotificationModel.updateMany(
    { recipientId, recipientRole, read: false },
    { read: true, readAt: new Date() },
  );
}

export async function getUnreadCount(
  recipientId: Types.ObjectId,
  recipientRole: RecipientRole,
): Promise<number> {
  return NotificationModel.countDocuments({
    recipientId,
    recipientRole,
    read: false,
  });
}

async function findOrganizationRepresentative(organizationId: Types.ObjectId) {
  const organization = await Organization.findById(organizationId)
    .select('legalName representativeUserId')
    .lean();

  if (!organization) {
    throw notFound('Organization was not found.', 'ORGANIZATION_NOT_FOUND');
  }

  return organization;
}

// Helpers that create notifications for common domain events.

export async function notifyApplicationSubmitted(
  studentId: Types.ObjectId,
  opportunityId: Types.ObjectId,
): Promise<NotificationRecord> {
  const opportunity = await Opportunity.findById(opportunityId)
    .select('title organizationId')
    .lean();

  if (!opportunity) {
    throw notFound('Opportunity was not found.', 'OPPORTUNITY_NOT_FOUND');
  }

  const organization = await findOrganizationRepresentative(opportunity.organizationId);
  const student = await Student.findOne({ userId: studentId }).select('fullName').lean();

  return createNotification(
    organization.representativeUserId,
    'organization_representative',
    'new_application_received',
    'New Application Received',
    `You have received a new application for "${opportunity.title}"${
      student?.fullName ? ` from ${student.fullName}` : ''
    }.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyApplicationStatusChanged(
  applicationId: Types.ObjectId,
  newStatus: string,
  _actorUserId: Types.ObjectId,
): Promise<NotificationRecord> {
  const application = await Application.findById(applicationId)
    .select('studentId opportunityId')
    .lean();

  if (!application) {
    throw notFound('Application was not found.', 'APPLICATION_NOT_FOUND');
  }

  const [opportunity] = await Promise.all([
    Opportunity.findById(application.opportunityId).select('title').lean(),
  ]);

  return createNotification(
    application.studentId,
    'student',
    'application_status_changed',
    'Application Status Updated',
    `Your application for "${opportunity?.title ?? 'the opportunity'}" is now "${newStatus}".`,
    applicationId,
    'application',
  );
}

export async function notifyApplicationAccepted(
  applicationId: Types.ObjectId,
): Promise<NotificationRecord> {
  const application = await Application.findById(applicationId)
    .select('studentId opportunityId')
    .lean();

  if (!application) {
    throw notFound('Application was not found.', 'APPLICATION_NOT_FOUND');
  }

  const opportunity = await Opportunity.findById(application.opportunityId)
    .select('title')
    .lean();

  return createNotification(
    application.studentId,
    'student',
    'application_accepted',
    'Application Accepted',
    `Congratulations! You have been accepted for "${opportunity?.title ?? 'the opportunity'}".`,
    applicationId,
    'application',
  );
}

export async function notifyApplicationRejected(
  applicationId: Types.ObjectId,
  reason?: string,
): Promise<NotificationRecord> {
  const application = await Application.findById(applicationId)
    .select('studentId opportunityId')
    .lean();

  if (!application) {
    throw notFound('Application was not found.', 'APPLICATION_NOT_FOUND');
  }

  const opportunity = await Opportunity.findById(application.opportunityId)
    .select('title')
    .lean();

  return createNotification(
    application.studentId,
    'student',
    'application_rejected',
    'Application Rejected',
    `Your application for "${opportunity?.title ?? 'the opportunity'}" was not successful.${
      reason ? ` Reason: ${reason}` : ''
    }`,
    applicationId,
    'application',
  );
}

export async function notifyOpportunityApproved(
  opportunityId: Types.ObjectId,
): Promise<NotificationRecord> {
  const opportunity = await Opportunity.findById(opportunityId)
    .select('title organizationId')
    .lean();

  if (!opportunity) {
    throw notFound('Opportunity was not found.', 'OPPORTUNITY_NOT_FOUND');
  }

  const organization = await findOrganizationRepresentative(opportunity.organizationId);

  return createNotification(
    organization.representativeUserId,
    'organization_representative',
    'opportunity_approved',
    'Opportunity Approved',
    `"${opportunity.title}" has been approved and is now published for students.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyOpportunityRejected(
  opportunityId: Types.ObjectId,
): Promise<NotificationRecord> {
  const opportunity = await Opportunity.findById(opportunityId)
    .select('title organizationId')
    .lean();

  if (!opportunity) {
    throw notFound('Opportunity was not found.', 'OPPORTUNITY_NOT_FOUND');
  }

  const organization = await findOrganizationRepresentative(opportunity.organizationId);

  return createNotification(
    organization.representativeUserId,
    'organization_representative',
    'opportunity_rejected',
    'Opportunity Rejected',
    `"${opportunity.title}" was rejected and is no longer available.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyOrganizationVerified(
  organizationId: Types.ObjectId,
): Promise<NotificationRecord> {
  const organization = await findOrganizationRepresentative(organizationId);

  return createNotification(
    organization.representativeUserId,
    'organization_representative',
    'organization_verified',
    'Organization Verified',
    `"${organization.legalName}" has been verified and can now publish opportunities.`,
    organizationId,
    'organization',
  );
}
