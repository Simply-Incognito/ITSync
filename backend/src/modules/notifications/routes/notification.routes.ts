import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from '../services/notification.service.js';

export const notificationRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];
const adminAccess = [requireAuthentication, requireRoles('administrator')];

notificationRouter.get(
  '/',
  ...studentAccess,
  async (request, response) => {
    const filters = { recipientId: request.identity!.id, recipientRole: 'student' };
    const result = await getNotifications(filters);
    response.json({ notifications: result.notifications, pagination: result.pagination });
  },
);

notificationRouter.get(
  '/unread-count',
  ...studentAccess,
  async (request, response) => {
    const count = await getUnreadCount(request.identity!.id, 'student');
    response.json({ unreadCount: count });
  },
);

notificationRouter.patch(
  '/:notificationId/read',
  ...studentAccess,
  async (request, response) => {
    const notification = await markNotificationAsRead(new request.params.notificationId);
    response.json({ notification });
  },
);

notificationRouter.patch(
  '/read-all',
  ...studentAccess,
  async (request, response) => {
    await markAllNotificationsAsRead(request.identity!.id, 'student');
    response.status(204).end();
  },
);

notificationRouter.get(
  '/org/unread-count',
  ...orgAccess,
  async (request, response) => {
    const count = await getUnreadCount(request.identity!.id, 'organization_representative');
    response.json({ unreadCount: count });
  },
);

notificationRouter.patch(
  '/org/read-all',
  ...orgAccess,
  async (request, response) => {
    await markAllNotificationsAsRead(request.identity!.id, 'organization_representative');
    response.status(204).end();
  },
);

notificationRouter.get(
  '/admin/unread-count',
  ...adminAccess,
  async (request, response) => {
    // For admin, we'd need to determine which role to check or show all
    // For now, show student unread count as example
    const count = await getUnreadCount('000000000000000000000000', 'administrator');
    response.json({ unreadCount: count });
  },
);

notificationRouter.patch(
  '/admin/read-all',
  ...adminAccess,
  async (request, response) => {
    // Admin mark-all would need recipient filtering logic
    response.status(204).end();
  },
);