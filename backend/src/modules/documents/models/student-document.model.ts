import { model, Schema, type Types } from 'mongoose';

export const studentDocumentTypes = ['student_id', 'biodata', 'cv'] as const;
export type StudentDocumentType = (typeof studentDocumentTypes)[number];

const studentDocumentSchema = new Schema(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: { type: String, enum: studentDocumentTypes, required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 180 },
    contentType: { type: String, enum: ['application/pdf', 'image/jpeg', 'image/png'], required: true },
    byteSize: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    storageId: { type: Schema.Types.ObjectId, required: true, unique: true },
  },
  { timestamps: true },
);

export const StudentDocument = model('StudentDocument', studentDocumentSchema);

export type StudentDocumentIdentity = {
  _id: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  documentType: StudentDocumentType;
};
