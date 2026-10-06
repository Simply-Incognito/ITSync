import { model, Schema, type Types } from 'mongoose';

export const applicationStatuses = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

const applicationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: applicationStatuses,
      default: 'submitted',
      required: true,
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 2000, default: null },
    documents: [{ type: Schema.Types.ObjectId, ref: 'OrganizationDocument' }],
  },
  { timestamps: true },
);

// Composite index to ensure each student can only have one application per opportunity
applicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

// Index to query applications by status
applicationSchema.index({ status: 1, createdAt: -1 });

export const Application = model('Application', applicationSchema);

export type ApplicationIdentity = {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  status: ApplicationStatus;
};