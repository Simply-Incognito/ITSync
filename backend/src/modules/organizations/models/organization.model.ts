import { model, Schema, type Types } from 'mongoose';

export const organizationStatuses = [
  'draft',
  'pending',
  'verified',
  'rejected',
  'suspended',
] as const;

export type OrganizationStatus = (typeof organizationStatuses)[number];

const organizationSchema = new Schema(
  {
    legalName: { type: String, required: true, trim: true, maxlength: 200 },
    tradingName: { type: String, trim: true, maxlength: 200, default: null },
    registrationCountry: { type: String, required: true, default: 'NG', uppercase: true },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true },
    industry: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    website: { type: String, trim: true, maxlength: 300, default: null },
    address: {
      street: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 120 },
      state: { type: String, required: true, trim: true, maxlength: 120 },
      country: { type: String, required: true, trim: true, maxlength: 120 },
      postalCode: { type: String, trim: true, maxlength: 30, default: null },
    },
    representativeUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    representativeName: { type: String, required: true, trim: true, maxlength: 160 },
    representativeTitle: { type: String, required: true, trim: true, maxlength: 120 },
    verificationStatus: {
      type: String,
      enum: organizationStatuses,
      default: 'draft',
      required: true,
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, trim: true, maxlength: 2000, default: null },
    suspensionReason: { type: String, trim: true, maxlength: 2000, default: null },
    riskFlags: [
      {
        code: { type: String, required: true, trim: true, maxlength: 80 },
        details: { type: String, required: true, trim: true, maxlength: 1000 },
        severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now, required: true },
        resolvedAt: { type: Date, default: null },
        resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
  },
  { timestamps: true },
);

// Ensure that the combination of registrationCountry and registrationNumber
//  is unique across all organizations
organizationSchema.index(
  { registrationCountry: 1, registrationNumber: 1 },
  { unique: true },
);

// Index to support queries for verified organizations, sorted by creation date
organizationSchema.index({ verificationStatus: 1, createdAt: 1 });

export const Organization = model('Organization', organizationSchema);

// Define a type for the organization identity that can be attached to the request object
export type OrganizationIdentity = {
  _id: Types.ObjectId;
  representativeUserId: Types.ObjectId;
  verificationStatus: OrganizationStatus;
};