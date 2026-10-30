import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/notifications/models/notification.model.js', () => ({
  Notification: {
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

import { Notification } from '../src/modules/notifications/models/notification.model.js';
import { markNotificationAsRead } from '../src/modules/notifications/services/notification.service.js';

const notificationId = new Types.ObjectId('68d2c50a8c4e1c843a39a400');
const studentId = new Types.ObjectId('68d2c50a8c4e1c843a39a401');

const notification = {
  _id: notificationId,
  recipientId: studentId,
  recipientRole: 'student',
  read: true,
};

describe('notification access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes the read update to the authenticated recipient', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockReturnValue({
      lean: () => Promise.resolve(notification),
    } as never);

    await markNotificationAsRead(notificationId, studentId, 'student');

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: notificationId, recipientId: studentId, recipientRole: 'student' },
      { read: true, readAt: expect.any(Date) },
      { new: true, runValidators: true },
    );
    expect(Notification.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('reports notifications owned by another recipient as not found', async () => {
    vi.mocked(Notification.findOneAndUpdate).mockReturnValue({
      lean: () => Promise.resolve(null),
    } as never);

    await expect(markNotificationAsRead(notificationId, studentId, 'student')).rejects.toMatchObject(
      { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND' },
    );
  });
});
