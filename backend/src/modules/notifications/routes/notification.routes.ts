import { Router, type Request } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { routeParam } from '../../../utils/route-param.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  type NotificationFilters,
} from '../services/notification.service.js';

export const notificationRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) {
    throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  }

  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];
const adminAccess = [requireAuthentication, requireRoles('administrator')];

notificationRouter.get('/', ...studentAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const filters: NotificationFilters = {
    recipientId: new Types.ObjectId(identity.id),
    recipientRole: 'student',
  };

  const result = await getNotifications(filters);
  response.json({ notifications: result.notifications, pagination: result.pagination });
});

notificationRouter.get('/unread-count', ...studentAccess, async (request, response) => {
  const count = await getUnreadCount(
    new Types.ObjectId(requireIdentity(request).id),
    'student',
  );

  response.json({ unreadCount: count });
});

notificationRouter.patch('/:notificationId/read', ...studentAccess, async (request, response) => {
  const notificationId = new Types.ObjectId(
    routeParam(request, 'notificationId', {
      code: 'NOTIFICATION_NOT_FOUND',
      message: 'Notification was not found.',
    }),
  );

  const notification = await markNotificationAsRead(notificationId);
  response.json({ notification });
});

notificationRouter.patch('/read-all', ...studentAccess, async (request, response) => {
  await markAllNotificationsAsRead(
    new Types.ObjectId(requireIdentity(request).id),
    'student',
  );

  response.status(204).end();
});

notificationRouter.get('/org', ...orgAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const filters: NotificationFilters = {
    recipientId: new Types.ObjectId(identity.id),
    recipientRole: 'organization_representative',
  };

  const result = await getNotifications(filters);
  response.json({ notifications: result.notifications, pagination: result.pagination });
});

notificationRouter.get('/org/unread-count', ...orgAccess, async (request, response) => {
  const count = await getUnreadCount(
    new Types.ObjectId(requireIdentity(request).id),
    'organization_representative',
  );

  response.json({ unreadCount: count });
});

notificationRouter.patch('/org/read-all', ...orgAccess, async (request, response) => {
  await markAllNotificationsAsRead(
    new Types.ObjectId(requireIdentity(request).id),
    'organization_representative',
  );

  response.status(204).end();
});

notificationRouter.get('/admin', ...adminAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const filters: NotificationFilters = {
    recipientId: new Types.ObjectId(identity.id),
    recipientRole: 'administrator',
  };

  const result = await getNotifications(filters);
  response.json({ notifications: result.notifications, pagination: result.pagination });
});

notificationRouter.get('/admin/unread-count', ...adminAccess, async (request, response) => {
  const count = await getUnreadCount(
    new Types.ObjectId(requireIdentity(request).id),
    'administrator',
  );

  response.json({ unreadCount: count });
});

notificationRouter.patch('/admin/read-all', ...adminAccess, async (request, response) => {
  await markAllNotificationsAsRead(
    new Types.ObjectId(requireIdentity(request).id),
    'administrator',
  );

  response.status(204).end();
});
