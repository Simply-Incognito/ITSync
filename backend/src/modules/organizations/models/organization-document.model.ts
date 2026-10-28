import { model, Schema } from 'mongoose';

export const organizationDocumentTypes = [
  'cac_certificate',
  'cac_status_report',
  'representative_authorization',
  'proof_of_address',
  'other',
] as const;

const organizationDocumentSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: { type: String, enum: organizationDocumentTypes, required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 180 },
    contentType: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'], required: true },
    byteSize: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    storageId: { type: Schema.Types.ObjectId, required: true, unique: true },
  },
  { timestamps: true },
);

export const OrganizationDocument = model('OrganizationDocument', organizationDocumentSchema);