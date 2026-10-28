import { model, Schema, type Types } from 'mongoose';

export interface AdministrationLogEntry {
  _id: Types.ObjectId;
  actorUserId: Types.ObjectId;
  action: string;
  targetType: 'user' | 'organization' | 'opportunity' | 'application';
  targetId: Types.ObjectId;
  details: Record<string, unknown>;
  createdAt: Date;
}

const administrationLogSchema = new Schema(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'organization', 'opportunity', 'application'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

administrationLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
administrationLogSchema.index({ actorUserId: 1, createdAt: -1 });

export const AdministrationLog = model('AdministrationLog', administrationLogSchema);