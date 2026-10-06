import { model, Schema } from 'mongoose';

export const opportunityReviewActions = [
  'submitted',
  'approved',
  'rejected',
  'closed',
  'suspended',
] as const;

const opportunityReviewEventSchema = new Schema(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: opportunityReviewActions, required: true },
    fromStatus: { type: String, enum: ['draft', 'pending_review', 'published', 'rejected'] },
    toStatus: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected', 'closed', 'suspended'],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

opportunityReviewEventSchema.index({ opportunityId: 1, createdAt: -1 });

export const OpportunityReviewEvent = model('OpportunityReviewEvent', opportunityReviewEventSchema);
