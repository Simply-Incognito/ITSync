import { model, Schema } from 'mongoose';
import { applicationStatuses } from './application.model.js';

export const applicationReviewActions = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

const applicationReviewEventSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: applicationReviewActions, required: true },
    fromStatus: { type: String, enum: applicationStatuses },
    toStatus: { type: String, enum: applicationStatuses, required: true },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applicationReviewEventSchema.index({ applicationId: 1, createdAt: -1 });

export const ApplicationReviewEvent = model('ApplicationReviewEvent', applicationReviewEventSchema);
