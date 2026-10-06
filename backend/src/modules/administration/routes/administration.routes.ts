import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  getUserManagement,
  getOrganizationManagement,
  getAdministrationDashboardStats,
} from '../services/administration.service.js';
import { AdministrationLog } from '../models/administration.model.js';

export const administrationRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const adminAccess = [requireAuthentication, requireRoles('administrator')];

administrationRouter.get(
  '/users',
  ...adminAccess,
  async (request, response) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 20;
    const search = request.query.search as string | undefined;

    const filters: { role?: string; status?: string; search?: string } = {};
    if (request.query.role) filters.role = request.query.role as UserRole;
    if (request.query.status) filters.status = request.query.status as 'active' | 'suspended';
    if (search) filters.search = search;

    const result = await getUserManagement(filters, page, limit);
    response.json({ users: result.users, pagination: result });
  },
);

administrationRouter.get(
  '/organizations',
  ...adminAccess,
  async (request, response) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 20;
    const status = request.query.status as OrganizationStatus | undefined;

    const filters: { status?: OrganizationStatus } = {};
    if (status) filters.status = status;

    const result = await getOrganizationManagement(filters, page, limit);
    response.json({ organizations: result.organizations, pagination: result });
  },
);

administrationRouter.get(
  '/dashboard/stats',
  ...adminAccess,
  async (request, response) => {
    const stats = await getAdministrationDashboardStats();
    response.json({ stats });
  },
);

administrationRouter.post(
  '/logs',
  ...adminAccess,
  async (request, response) => {
    const { actorUserId, action, targetType, targetId, details } = request.body;

    if (!actorUserId || !action || !targetType || !targetId) {
      throw new AppError(
        'actorUserId, action, targetType, and targetId are required.',
        400,
        'MISSING_REQUIRED_FIELDS',
      );
    }

    const logEntry = new AdministrationLog({
      actorUserId: new Types.ObjectId(actorUserId),
      action,
      targetType,
      targetId: new Types.ObjectId(targetId),
      details: details || {},
    });

    await logEntry.save();
    response.status(201).json({ logEntry });
  },
);

administrationRouter.get(
  '/logs',
  ...adminAccess,
  async (request, response) => {
    const { targetType, targetId, actorUserId } = request.query;

    const filter: Record<string, unknown> = {};
    if (targetType) filter.targetType = targetType as string;
    if (targetId) filter.targetId = new Types.ObjectId(targetId as string);
    if (actorUserId) filter.actorUserId = new Types.ObjectId(actorUserId as string);

    const logs = await AdministrationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    response.json({ logs });
  },
);

administrationRouter.patch(
  '/users/:userId/status',
  ...adminAccess,
  async (request, response) => {
    const { userId } = request.params;
    const { status } = request.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      throw new AppError(
        'Valid status (active or suspended) is required.',
        400,
        'INVALID_STATUS',
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true },
    ).select('email role status').lean();

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    response.json({ user });
  },
);

administrationRouter.patch(
  '/organizations/:organizationId/verification',
  ...adminAccess,
  async (request, response) => {
    const { organizationId } = request.params;
    const { verificationStatus, notes } = request.body;

    if (!verificationStatus || !['verified', 'rejected', 'suspended'].includes(verificationStatus)) {
      throw new AppError(
        'Valid verification status (verified, rejected, or suspended) is required.',
        400,
        'INVALID_VERIFICATION_STATUS',
      );
    }

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { verificationStatus, rejectionReason: verificationStatus === 'rejected' ? notes || null : null },
      { new: true, runValidators: true },
    ).select('legalName verificationStatus verifiedAt rejectionReason').lean();

    if (!organization) {
      throw new AppError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
    }

    response.json({ organization });
  },
);