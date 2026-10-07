import mongoose, { Types } from 'mongoose';
import { Application } from '../../applications/models/application.model.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import { User } from '../../identity/models/user.model.js';

export interface Notification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientRole: 'student' | 'organization_representative' | 'administrator';
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: Types.ObjectId;
  relatedEntityType?: 'application' | 'opportunity' | 'organization';
  read: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export type NotificationType =
  | 'application_submitted'
  | 'application_status_changed'
  | 'application_accepted'
  | 'application_rejected'
  | 'new_application_received'
  | 'opportunity_approved'
  | 'opportunity_rejected'
  | 'opportunity_suspended'
  | 'organization_verified'
  | 'system';

export interface NotificationFilters {
  recipientId?: Types.ObjectId;
  recipientRole?: 'student' | 'organization_representative' | 'administrator';
  type?: NotificationType;
  read?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function createNotification(
  recipientId: Types.ObjectId,
  recipientRole: 'student' | 'organization_representative' | 'administrator',
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityId?: Types.ObjectId,
  relatedEntityType?: 'application' | 'opportunity' | 'organization',
): Promise<Notification> {
  const notification = new Notification({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    relatedEntityId,
    relatedEntityType,
    read: false,
    createdAt: new Date(),
  });

  await notification.save();
  return notification;
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
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
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
): Promise<Notification> {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: new Date() },
    { new: true, runValidators: true },
  ).lean();
  return notification;
}

export async function markAllNotificationsAsRead(
  recipientId: Types.ObjectId,
  recipientRole: 'student' | 'organization_representative' | 'administrator',
): Promise<void> {
  await Notification.updateMany(
    { recipientId, recipientRole, read: false },
    { read: true, readAt: new Date() },
  );
}

export async function getUnreadCount(
  recipientId: Types.ObjectId,
  recipientRole: 'student' | 'organization_representative' | 'administrator',
): Promise<number> {
  return Notification.countDocuments({
    recipientId,
    recipientRole,
    read: false,
  });
}

// Helper functions to create specific notification types

export async function notifyApplicationSubmitted(
  studentId: Types.ObjectId,
  opportunityId: Types.ObjectId,
): Promise<Notification> {
  const student = await User.findById(studentId).select('role').lean();
  const opportunity = await Opportunity.findById(opportunityId)
    .populate('organizationId', 'legalName')
    .lean();

  return createNotification(
    opportunity.organizationId._id,
    'organization_representative',
    'new_application_received',
    'New Application Received',
    `You have received a new application for the "${opportunity.title}" opportunity from a student.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyApplicationStatusChanged(
  applicationId: Types.ObjectId,
  newStatus: string,
  actorUserId: Types.ObjectId,
): Promise<Notification> {
  const application = await Application.findById(applicationId)
    .populate('studentId', 'fullName')
    .populate('opportunityId', 'title')
    .lean();

  if (!application) throw new Error('Application not found');

  return createNotification(
    application.opportunityId.organizationId._id,
    'organization_representative',
    'application_status_changed',
    'Application Status Updated',
    `The application status has been changed to "${newStatus}" for ${application.studentId.fullName}'s application to "${application.opportunityId.title}".`,
    applicationId,
    'application',
  );
}

export async function notifyApplicationAccepted(
  applicationId: Types.ObjectId,
): Promise<Notification> {
  const application = await Application.findById(applicationId)
    .populate('studentId', 'fullName')
    .populate('opportunityId', 'title')
    .lean();

  if (!application) throw new Error('Application not found');

  return createNotification(
    application.opportunityId.organizationId._id,
    'organization_representative',
    'application_accepted',
    'Application Accepted',
    `Congratulations! ${application.studentId.fullName} has been accepted for the "${application.opportunityId.title}" opportunity.`,
    applicationId,
    'application',
  );
}

export async function notifyApplicationRejected(
  applicationId: Types.ObjectId,
  reason?: string,
): Promise<Notification> {
  const application = await Application.findById(applicationId)
    .populate('studentId', 'fullName')
    .populate('opportunityId', 'title')
    .lean();

  if (!application) throw new Error('Application not found');

  const reasonMessage = reason ? ` Reason: ${reason}` : '';

  return createNotification(
    application.opportunityId.organizationId._id,
    'organization_representative',
    'application_rejected',
    'Application Rejected',
    `The application has been rejected${reasonMessage} for ${application.studentId.fullName}'s application to "${application.opportunityId.title}".`,
    applicationId,
    'application',
  );
}

export async function notifyOpportunityApproved(
  opportunityId: Types.ObjectId,
): Promise<Notification> {
  const opportunity = await Opportunity.findById(opportunityId)
    .populate('organizationId', 'legalName')
    .lean();

  if (!opportunity) throw new Error('Opportunity not found');

  return createNotification(
    '000000000000000000000000', // Administrator user ID - would be fetched dynamically
    'administrator',
    'opportunity_approved',
    'Opportunity Approved',
    `The opportunity "${opportunity.title}" has been approved and is now published for students.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyOpportunityRejected(
  opportunityId: Types.ObjectId,
): Promise<Notification> {
  const opportunity = await Opportunity.findById(opportunityId)
    .populate('organizationId', 'legalName')
    .lean();

  if (!opportunity) throw new Error('Opportunity not found');

  return createNotification(
    '000000000000000000000000', // Administrator user ID
    'administrator',
    'opportunity_rejected',
    'Opportunity Rejected',
    `The opportunity "${opportunity.title}" has been rejected and is no longer available.`,
    opportunityId,
    'opportunity',
  );
}

export async function notifyOrganizationVerified(
  organizationId: Types.ObjectId,
): Promise<Notification> {
  const organization = await Organization.findById(organizationId)
    .populate('representativeUserId', 'fullName email')
    .lean();

  if (!organization) throw new Error('Organization not found');

  return createNotification(
    '000000000000000000000000', // Administrator user ID
    'administrator',
    'organization_verified',
    'Organization Verified',
    `The organization "${organization.legalName}" has been verified and can now publish opportunities.`,
    organizationId,
    'organization',
  );
}
