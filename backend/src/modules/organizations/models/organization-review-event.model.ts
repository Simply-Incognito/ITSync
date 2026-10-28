import { model, Schema } from 'mongoose';

const verificationChecksSchema = new Schema(
  {
    registryRecordFound: { type: Boolean, required: true },
    legalNameAndNumberMatch: { type: Boolean, required: true },
    representativeAuthorityConfirmed: { type: Boolean, required: true },
    independentlySourcedContactConfirmed: { type: Boolean, required: true },
    documentsAppearAuthentic: { type: Boolean, required: true },
  },
  { _id: false },
);

const organizationReviewEventSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'submitted',
        'approved',
        'rejected',
        'suspended',
        'risk_flagged',
        'risk_resolved',
        'document_accessed',
      ],
      required: true,
    },
    documentId: { type: Schema.Types.ObjectId, ref: 'OrganizationDocument', default: null },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 2000, default: null },
    registrySource: { type: String, trim: true, maxlength: 200, default: null },
    registryReference: { type: String, trim: true, maxlength: 200, default: null },
    verificationChecks: { type: verificationChecksSchema, default: null },
  },
  { timestamps: true },
);

organizationReviewEventSchema.index({ organizationId: 1, createdAt: -1 });

export const OrganizationReviewEvent = model(
  'OrganizationReviewEvent',
  organizationReviewEventSchema,
);
