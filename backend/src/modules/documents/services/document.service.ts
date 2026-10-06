import mongoose from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { OrganizationDocument } from '../../organizations/models/organization-document.model.js';
import { Student } from '../../identity/models/student.model.js';
import { Organization } from '../../organizations/models/organization.model.js';
import { User } from '../../identity/models/user.model.js';
import { maxOrganizationDocumentBytes } from '../../organizations/utils/document-storage.js';
import { fileTypeFromBuffer } from 'file-type';

export interface UploadedDocument {
  storageId: Types.ObjectId;
  originalName: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  documentType: string;
  uploadedBy: Types.ObjectId;
}

export interface DocumentUploadInput {
  file: Express.Multer.File;
  documentType: string;
  uploadedBy: Types.ObjectId;
  organizationId?: Types.ObjectId;
}

export async function uploadDocument(
  input: DocumentUploadInput,
): Promise<UploadedDocument> {
  const { file, documentType, uploadedBy, organizationId } = input;

  // Validate document type based on organization or student
  const isOrganization = !!organizationId;
  const acceptedDocumentTypes = new Set([
    'cac_certificate',
    'cac_status_report',
    'representative_authorization',
    'proof_of_address',
    'other',
  ]);

  if (!acceptedDocumentTypes.has(documentType)) {
    throw new AppError(
      'Invalid document type.',
      400,
      'INVALID_DOCUMENT_TYPE',
    );
  }

  // Validate file size
  if (file.size < 1 || file.size > maxOrganizationDocumentBytes) {
    throw new AppError(
      'Documents must be no larger than 5 MB.',
      400,
      'INVALID_DOCUMENT_SIZE',
    );
  }

  // Validate file type using file-type library
  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !acceptedDocumentTypes.has(detectedType.mime)) {
    throw new AppError(
      'Only PDF, JPEG, or PNG documents are accepted.',
      400,
      'INVALID_DOCUMENT_TYPE',
    );
  }

  // Determine the bucket and collection based on organization or student
  let storageId: Types.ObjectId;
  let documentRecord;

  if (isOrganization) {
    // For organization documents, use the existing OrganizationDocument model
    const organization = await Organization.findById(organizationId).select(
      '_id',
    ).lean();

    if (!organization) {
      throw new AppError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
    }

    // Check if document already exists for this type
    const existingDocument = await OrganizationDocument.findOne({
      organizationId,
      documentType,
    }).lean();

    if (existingDocument) {
      // Delete the old file from GridFS
      await deleteOrganizationDocument(existingDocument.storageId).catch(
        () => undefined,
      );
    }

    // Store the new document in GridFS
    const sha256 = createSHA256(file.buffer);
    const bucket = getOrganizationDocumentBucket();
    const uploadStream = bucket.openUploadStream(
      `${documentType}-${uploadedBy.toString().slice(0, 8)}`,
      {
        contentType: detectedType.mime,
        metadata: {
          organizationId,
          documentType,
          uploadedBy,
          sha256,
        },
      },
    );

    await new Promise<void>((resolve, reject) => {
      uploadStream.once('error', reject);
      uploadStream.once('finish', resolve);
      uploadStream.end(file.buffer);
    });

    storageId = uploadStream.id as Types.ObjectId;

    // Save metadata to MongoDB
    documentRecord = await OrganizationDocument.create({
      organizationId,
      uploadedBy,
      documentType,
      originalName: basename(file.originalname).replace(/\p{Cc}/gu, '').slice(0, 180),
      contentType: detectedType.mime,
      byteSize: file.size,
      sha256,
      storageId,
    });
  } else {
    // For student documents, we'll store metadata differently
    // Students can upload CVs and other supporting documents
    const sha256 = createSHA256(file.buffer);
    const bucket = getStudentDocumentBucket();
    const uploadStream = bucket.openUploadStream(
      `student-${uploadedBy.toString().slice(0, 8)}`,
      {
        contentType: detectedType.mime,
        metadata: {
          studentId: uploadedBy,
          documentType,
          sha256,
        },
      },
    );

    await new Promise<void>((resolve, reject) => {
      uploadStream.once('error', reject);
      uploadStream.once('finish', resolve);
      uploadStream.end(file.buffer);
    });

    storageId = uploadStream.id as Types.ObjectId;

    // For students, we'll track documents differently - just store the metadata reference
    // In a full implementation, would create a StudentDocument model
    documentRecord = {
      _id: storageId,
      storageId,
      documentType,
      uploadedBy,
      originalName: basename(file.originalname).replace(/\p{Cc}/gu, '').slice(0, 180),
      contentType: detectedType.mime,
      byteSize: file.size,
      sha256,
    };
  }

  return {
    storageId: documentRecord._id instanceof Types.ObjectId
      ? documentRecord._id
      : storageId,
    originalName: documentRecord.originalName,
    contentType: documentRecord.contentType,
    byteSize: documentRecord.byteSize,
    sha256: documentRecord.sha256,
    documentType,
  };
}

export async function downloadDocument(
  storageId: Types.ObjectId,
): Promise<Buffer> {
  const bucket = getOrganizationDocumentBucket();
  const downloadStream = bucket.openDownloadStream(storageId);

  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    downloadStream.on('error', reject);
    downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function deleteDocument(
  storageId: Types.ObjectId,
  isOrganizationDocument: boolean = true,
): Promise<void> {
  if (isOrganizationDocument) {
    await deleteOrganizationDocument(storageId);
  } else {
    const bucket = getStudentDocumentBucket();
    await bucket.delete(storageId);
  }
}

function createSHA256(buffer: Buffer): string {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getOrganizationDocumentBucket() {
  const database = mongoose.connection.db;
  if (!database) {
    throw new AppError('Document storage is unavailable.', 503, 'DOCUMENT_STORAGE_UNAVAILABLE');
  }
  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'organization_documents' });
}

function getStudentDocumentBucket() {
  const database = mongoose.connection.db;
  if (!database) {
    throw new AppError('Document storage is unavailable.', 503, 'DOCUMENT_STORAGE_UNAVAILABLE');
  }
  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'student_documents' });
}

function basename(path: string): string {
  const crypto = require('node:crypto');
  // Simple basename extraction - in production would use path module
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

export { maxOrganizationDocumentBytes };