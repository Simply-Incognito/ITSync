import { Router } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import { User, type UserRole } from '../../identity/models/user.model.js';
import type { OrganizationStatus } from '../../organizations/models/organization.model.js';
import { OrganizationReviewEvent } from '../../organizations/models/organization-review-event.model.js';
import { ApplicationReviewEvent } from '../../applications/models/application-review-event.model.js';
import { OpportunityReviewEvent } from '../../opportunities/models/opportunity-review-event.model.js';
import {
  getUserManagement,
  getOrganizationManagement,
  getAdministrationDashboardStats,
  type UserManagementFilter,
  type OrganizationManagementFilter,
} from '../services/administration.service.js';
import { AdministrationLog } from '../models/administration.model.js';

export const administrationRouter = Router();

const adminAccess = [requireAuthentication, requireRoles('administrator')];

administrationRouter.get('/users', ...adminAccess, async (request, response) => {
  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 20;
  const search = request.query.search as string | undefined;

  const filters: UserManagementFilter = {};
  if (typeof request.query.role === 'string') filters.role = request.query.role as UserRole;
  if (request.query.status === 'active' || request.query.status === 'suspended') {
    filters.status = request.query.status;
  }
  if (search) filters.search = search;

  const result = await getUserManagement(filters, page, limit);
  response.json({ users: result.users, pagination: result });
});

administrationRouter.get('/organizations', ...adminAccess, async (request, response) => {
  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 20;
  const status = request.query.status as OrganizationStatus | undefined;

  const filters: OrganizationManagementFilter = {};
  if (status) filters.status = status;

  const result = await getOrganizationManagement(filters, page, limit);
  response.json({ organizations: result.organizations, pagination: result });
});

administrationRouter.get('/dashboard/stats', ...adminAccess, async (request, response) => {
  const stats = await getAdministrationDashboardStats();
  response.json({ stats });
});

administrationRouter.post('/logs', ...adminAccess, async (request, response) => {
  const { action, targetType, targetId, details } = request.body;

  if (!action || !targetType || !targetId) {
    throw new AppError(
      'action, targetType, and targetId are required.',
      400,
      'MISSING_REQUIRED_FIELDS',
    );
  }
  if (
    typeof action !== 'string' ||
    !['user', 'organization', 'opportunity', 'application'].includes(targetType) ||
    typeof targetId !== 'string' ||
    !Types.ObjectId.isValid(targetId)
  ) {
    throw new AppError('Invalid administration log data.', 400, 'INVALID_LOG_DATA');
  }

  const logEntry = new AdministrationLog({
    actorUserId: new Types.ObjectId(request.identity!.id),
    action,
    targetType,
    targetId: new Types.ObjectId(targetId),
    details: details || {},
  });

  await logEntry.save();
  response.status(201).json({ logEntry });
});

administrationRouter.get('/logs', ...adminAccess, async (request, response) => {
  const { targetType, targetId, actorUserId } = request.query;

  const filter: Record<string, unknown> = {};
  if (targetType) filter.targetType = targetType as string;
  if (targetId) {
    if (typeof targetId !== 'string' || !Types.ObjectId.isValid(targetId)) {
      throw new AppError('Invalid target ID.', 400, 'INVALID_TARGET_ID');
    }
    filter.targetId = new Types.ObjectId(targetId);
  }
  if (actorUserId) {
    if (typeof actorUserId !== 'string' || !Types.ObjectId.isValid(actorUserId)) {
      throw new AppError('Invalid administrator ID.', 400, 'INVALID_ACTOR_ID');
    }
    filter.actorUserId = new Types.ObjectId(actorUserId);
  }

  const logs = await AdministrationLog.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  response.json({ logs });
});

administrationRouter.get('/activity', ...adminAccess, async (_request, response) => {
  const [logs, organizationReviews, opportunityReviews, applicationReviews] = await Promise.all([
    AdministrationLog.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    OrganizationReviewEvent.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    OpportunityReviewEvent.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    ApplicationReviewEvent.find({}).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const activities = [
    ...logs.map((event) => ({
      _id: String(event._id),
      actorUserId: String(event.actorUserId),
      action: event.action,
      targetType: event.targetType,
      targetId: String(event.targetId),
      details: event.details,
      createdAt: event.createdAt,
    })),
    ...organizationReviews.map((event) => ({
      _id: String(event._id),
      actorUserId: String(event.actorUserId),
      action: event.action,
      targetType: 'organization' as const,
      targetId: String(event.organizationId),
      details: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        registrySource: event.registrySource,
        registryReference: event.registryReference,
      },
      createdAt: event.createdAt,
    })),
    ...opportunityReviews.map((event) => ({
      _id: String(event._id),
      actorUserId: String(event.actorUserId),
      action: event.action,
      targetType: 'opportunity' as const,
      targetId: String(event.opportunityId),
      details: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
      },
      createdAt: event.createdAt,
    })),
    ...applicationReviews.map((event) => ({
      _id: String(event._id),
      actorUserId: String(event.actorUserId ?? ''),
      action: event.action,
      targetType: 'application' as const,
      targetId: String(event.applicationId),
      details: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
      },
      createdAt: event.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 100);

  response.json({ activities });
});

administrationRouter.patch('/users/:userId/status', ...adminAccess, async (request, response) => {
  const { userId } = request.params;
  const { status } = request.body;

  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  if (!status || !['active', 'suspended'].includes(status)) {
    throw new AppError('Valid status (active or suspended) is required.', 400, 'INVALID_STATUS');
  }
  if (userId === request.identity!.id && status === 'suspended') {
    throw new AppError('You cannot suspend your own account.', 400, 'CANNOT_SUSPEND_SELF');
  }

  const user = await User.findByIdAndUpdate(userId, { status }, { new: true, runValidators: true })
    .select('email role status')
    .lean();

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const logEntry = new AdministrationLog({
    actorUserId: new Types.ObjectId(request.identity!.id),
    action: 'user_status_changed',
    targetType: 'user',
    targetId: user._id,
    details: { status: user.status },
  });
  await logEntry.save();

  response.json({ user });
});
