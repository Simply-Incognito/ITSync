import { model, Schema, type Types } from 'mongoose';

export const opportunityStatuses = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'closed',
  'suspended',
] as const;

export type OpportunityStatus = (typeof opportunityStatuses)[number];

const opportunitySchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    fieldOfStudy: { type: String, required: true, trim: true, maxlength: 160 },
    requiredSkills: [{ type: String, trim: true, maxlength: 100 }],
    academicRequirements: { type: String, trim: true, maxlength: 3000, default: '' },
    location: {
      city: { type: String, required: true, trim: true, maxlength: 120 },
      state: { type: String, required: true, trim: true, maxlength: 120 },
      country: { type: String, required: true, trim: true, maxlength: 120 },
    },
    workArrangement: { type: String, enum: ['onsite', 'hybrid', 'remote'], required: true },
    durationWeeks: { type: Number, required: true, min: 1, max: 104 },
    availableSlots: { type: Number, required: true, min: 1, max: 10000 },
    applicationDeadline: { type: Date, required: true },
    requiredDocuments: [{ type: String, trim: true, maxlength: 120 }],
    additionalRequirements: { type: String, trim: true, maxlength: 3000, default: '' },
    status: { type: String, enum: opportunityStatuses, default: 'draft', required: true },
    publishedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, maxlength: 2000, default: null },
  },
  { timestamps: true },
);

opportunitySchema.index({ organizationId: 1, status: 1, createdAt: -1 });
opportunitySchema.index({ status: 1, publishedAt: -1, applicationDeadline: 1 });

export const Opportunity = model('Opportunity', opportunitySchema);

export type OpportunityIdentity = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  status: OpportunityStatus;
};
