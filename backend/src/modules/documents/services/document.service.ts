import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import mongoose, { type Types } from 'mongoose';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../../../errors/app-error.js';
import { Application } from '../../applications/models/application.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import {
  OrganizationDocument,
  organizationDocumentTypes,
} from '../../organizations/models/organization-document.model.js';
import {
  deleteOrganizationDocument,
  storeOrganizationDocument,
} from '../../organizations/utils/document-storage.js';
import { Opportunity } from '../../opportunities/models/opportunity.model.js';
import { StudentDocument, type StudentDocumentType } from '../models/student-document.model.js';

const acceptedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const studentVerificationDocumentTypes = new Set<StudentDocumentType>(['student_id', 'biodata']);
const maxStudentVerificationDocumentBytes = 1 * 1024 * 1024;
const maxStudentDocumentBytes = 5 * 1024 * 1024;

export const documentTypes = [...organizationDocumentTypes, 'cv', 'student_id', 'biodata'] as const;

export type DocumentType = (typeof documentTypes)[number];

export interface UploadedDocument {
  documentId: Types.ObjectId;
  storageId: Types.ObjectId;
  originalName: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  documentType: DocumentType;
  uploadedBy: Types.ObjectId;
}

export interface DownloadableDocument {
  buffer: Buffer;
  contentType: string;
  originalName: string;
}

async function validateFile(file: Express.Multer.File, documentType: DocumentType) {
  const maxBytes = documentType === 'student_id' || documentType === 'biodata'
    ? maxStudentVerificationDocumentBytes
    : maxStudentDocumentBytes;
  if (file.size < 1 || file.size > maxBytes) {
    const maxSizeLabel = maxBytes === maxStudentVerificationDocumentBytes ? '1 MB' : '5 MB';
    throw new AppError(`Documents must be no larger than ${maxSizeLabel}.`, 400, 'INVALID_DOCUMENT_SIZE');
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || !acceptedMimeTypes.has(detectedType.mime)) {
    throw new AppError(
      'Only PDF, JPEG, or PNG documents are accepted.',
      400,
      'INVALID_DOCUMENT_TYPE',
    );
  }

  return detectedType;
}

function safeOriginalName(originalName: string) {
  const name = basename(originalName)
    .replace(/\p{Cc}/gu, '')
    .slice(0, 180);

  if (!name) {
    throw new AppError('A document filename is required.', 400, 'INVALID_DOCUMENT_NAME');
  }

  return name;
}

function getStudentDocumentBucket() {
  const database = mongoose.connection.db;

  if (!database) {
    throw new AppError(
      'Document storage is unavailable.',
      503,
      'DOCUMENT_STORAGE_UNAVAILABLE',
    );
  }

  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'student_documents' });
}

async function getOrganizationDocumentBucket() {
  const database = mongoose.connection.db;

  if (!database) {
    throw new AppError(
      'Document storage is unavailable.',
      503,
      'DOCUMENT_STORAGE_UNAVAILABLE',
    );
  }

  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'organization_documents' });
}

export async function uploadOrganizationDocument(input: {
  file: Express.Multer.File;
  documentType: DocumentType;
  uploadedBy: Types.ObjectId;
}): Promise<UploadedDocument> {
  const { file, documentType, uploadedBy } = input;

  const organization = await Organization.findOne({ representativeUserId: uploadedBy })
    .select('_id verificationStatus')
    .lean();

  if (!organization) {
    throw new AppError(
      'Organization profile not found. Please create your organization profile first.',
      404,
      'ORGANIZATION_NOT_FOUND',
    );
  }

  if (!['draft', 'rejected'].includes(organization.verificationStatus)) {
    throw new AppError(
      'Documents can only be changed while verification is in draft or rejected status.',
      409,
      'VERIFICATION_NOT_EDITABLE',
    );
  }

  await validateFile(file, documentType);

  const stored = await storeOrganizationDocument(file, {
    organizationId: String(organization._id),
    uploadedBy: String(uploadedBy),
    documentType,
  });

  try {
    const record = await OrganizationDocument.create({
      organizationId: organization._id,
      uploadedBy,
      documentType,
      ...stored,
    });

    return {
      documentId: record._id,
      storageId: record.storageId,
      originalName: record.originalName,
      contentType: record.contentType,
      byteSize: record.byteSize,
      sha256: record.sha256,
      documentType,
      uploadedBy,
    };
  } catch (error) {
    await deleteOrganizationDocument(stored.storageId).catch(() => undefined);
    throw error;
  }
}

export async function uploadStudentDocument(input: {
  file: Express.Multer.File;
  documentType: DocumentType;
  uploadedBy: Types.ObjectId;
}): Promise<UploadedDocument> {
  const { file, documentType, uploadedBy } = input;

  const detectedType = await validateFile(file, documentType);
  const originalName = safeOriginalName(file.originalname);
  const sha256 = createHash('sha256').update(file.buffer).digest('hex');
  const bucket = getStudentDocumentBucket();
  const metadata = {
    studentId: uploadedBy,
    documentType,
    sha256,
  };
  const uploadStream = bucket.openUploadStream(originalName, {
    contentType: detectedType.mime,
    metadata,
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.once('error', reject);
    uploadStream.once('finish', resolve);
    uploadStream.end(file.buffer);
  });

  const storageId = uploadStream.id as Types.ObjectId;

  try {
    const record = await StudentDocument.create({
      uploadedBy,
      documentType,
      originalName,
      contentType: detectedType.mime,
      byteSize: file.size,
      sha256,
      storageId,
    });

    return {
      documentId: record._id,
      storageId,
      originalName,
      contentType: detectedType.mime,
      byteSize: file.size,
      sha256,
      documentType,
      uploadedBy,
    };
  } catch (error) {
    await bucket.delete(storageId).catch(() => undefined);
    throw error;
  }
}

export async function assertStudentVerificationDocuments(
  documentIds: Types.ObjectId[],
  studentId: Types.ObjectId,
) {
  if (documentIds.length !== 1) {
    throw new AppError(
      'Upload either your student ID or biodata to apply.',
      400,
      'VERIFICATION_DOCUMENT_REQUIRED',
    );
  }

  const documents = await StudentDocument.find({
    _id: { $in: documentIds },
    uploadedBy: studentId,
    documentType: { $in: [...studentVerificationDocumentTypes] },
  })
    .select('_id')
    .lean();

  if (documents.length !== 1) {
    throw new AppError(
      'Upload a valid student ID or biodata file before applying.',
      400,
      'INVALID_VERIFICATION_DOCUMENT',
    );
  }
}

export async function downloadStudentApplicationDocument(
  applicationId: Types.ObjectId,
  documentId: Types.ObjectId,
  representativeUserId: Types.ObjectId,
): Promise<DownloadableDocument> {
  const organization = await Organization.findOne({ representativeUserId })
    .select('_id')
    .lean();
  if (!organization) throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');

  const application = await Application.findOne({
    _id: applicationId,
    documents: documentId,
  })
    .select('opportunityId')
    .lean();
  if (!application) throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');

  const opportunity = await Opportunity.findOne({
    _id: application.opportunityId,
    organizationId: organization._id,
  })
    .select('_id')
    .lean();
  if (!opportunity) throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');

  const record = await StudentDocument.findById(documentId).lean();
  if (!record) throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');

  const bucket = getStudentDocumentBucket();
  const chunks: Buffer[] = [];

  return new Promise<DownloadableDocument>((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(record.storageId);
    downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    downloadStream.on('error', () =>
      reject(new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND')),
    );
    downloadStream.on('end', () =>
      resolve({
        buffer: Buffer.concat(chunks),
        contentType: record.contentType,
        originalName: record.originalName,
      }),
    );
  });
}

async function findOrganizationDocumentRecord(documentId: Types.ObjectId) {
  // Callers may hold either the database record id or the GridFS storage id.
  // Resolve both so a lookup can never fall through to the wrong bucket.
  return OrganizationDocument.findOne({
    $or: [{ _id: documentId }, { storageId: documentId }],
  }).lean();
}

async function findDocumentOwnedBy(
  documentId: Types.ObjectId,
  representativeUserId: Types.ObjectId,
) {
  const record = await findOrganizationDocumentRecord(documentId);

  if (!record) {
    throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  const organization = await Organization.findOne({
    _id: record.organizationId,
    representativeUserId,
  })
    .select('_id')
    .lean();

  if (!organization) {
    // Respond as if the document does not exist so ids belonging to other
    // organizations cannot be probed for existence.
    throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  return record;
}

export async function downloadDocument(
  documentId: Types.ObjectId,
  representativeUserId: Types.ObjectId,
): Promise<DownloadableDocument> {
  const record = await findDocumentOwnedBy(documentId, representativeUserId);
  const bucket = await getOrganizationDocumentBucket();

  const chunks: Buffer[] = [];

  return new Promise<DownloadableDocument>((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(record.storageId);

    downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    downloadStream.on('error', () =>
      reject(new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND')),
    );
    downloadStream.on('end', () =>
      resolve({
        buffer: Buffer.concat(chunks),
        contentType: record.contentType,
        originalName: record.originalName,
      }),
    );
  });
}

export async function deleteDocument(
  documentId: Types.ObjectId,
  representativeUserId: Types.ObjectId,
): Promise<void> {
  const record = await findDocumentOwnedBy(documentId, representativeUserId);

  await OrganizationDocument.deleteOne({ _id: record._id });
  await deleteOrganizationDocument(record.storageId).catch(() => undefined);
}
