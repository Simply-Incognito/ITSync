import { model, Schema } from 'mongoose';

export interface NotificationDocument {
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

export const notificationTypes = [
  'application_submitted',
  'application_status_changed',
  'application_accepted',
  'application_rejected',
  'new_application_received',
  'opportunity_approved',
  'opportunity_rejected',
  'opportunity_suspended',
  'organization_verified',
  'system',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['student', 'organization_representative', 'administrator'],
      required: true,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      type: String,
      enum: ['application', 'opportunity', 'organization'],
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model('Notification', notificationSchema);