import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import mongoose from 'mongoose';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../../../errors/app-error.js';

export const maxOrganizationDocumentBytes = 5 * 1024 * 1024;

type UploadedDocument = {
  originalname: string;
  size: number;
  buffer: Buffer;
};

const acceptedDocumentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function getOrganizationDocumentBucket() {
  const database = mongoose.connection.db;
  if (!database) {
    throw new AppError('Document storage is unavailable.', 503, 'DOCUMENT_STORAGE_UNAVAILABLE');
  }
  return new mongoose.mongo.GridFSBucket(database, { bucketName: 'organization_documents' });
}

export async function storeOrganizationDocument(
  file: UploadedDocument,
  metadata: { organizationId: string; uploadedBy: string; documentType: string },
) {
  if (file.size < 1 || file.size > maxOrganizationDocumentBytes) {
    throw new AppError('Documents must be no larger than 5 MB.', 400, 'INVALID_DOCUMENT_SIZE');
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !acceptedDocumentTypes.has(detectedType.mime)) {
    throw new AppError(
      'Only PDF, JPEG, or PNG documents are accepted.',
      400,
      'INVALID_DOCUMENT_TYPE',
    );
  }

  const originalName = basename(file.originalname)
    .replace(/\p{Cc}/gu, '')
    .slice(0, 180);
  if (!originalName) {
    throw new AppError('A document filename is required.', 400, 'INVALID_DOCUMENT_NAME');
  }

  const sha256 = createHash('sha256').update(file.buffer).digest('hex');
  const bucket = getOrganizationDocumentBucket();
  const uploadStream = bucket.openUploadStream(originalName, {
    contentType: detectedType.mime,
    metadata: { ...metadata, sha256 },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.once('error', reject);
    uploadStream.once('finish', resolve);
    uploadStream.end(file.buffer);
  });

  return {
    storageId: uploadStream.id as mongoose.mongo.ObjectId,
    originalName,
    contentType: detectedType.mime,
    byteSize: file.size,
    sha256,
  };
}

export function openOrganizationDocument(storageId: mongoose.mongo.ObjectId) {
  return getOrganizationDocumentBucket().openDownloadStream(storageId);
}

export async function deleteOrganizationDocument(storageId: mongoose.mongo.ObjectId) {
  await getOrganizationDocumentBucket().delete(storageId);
}
