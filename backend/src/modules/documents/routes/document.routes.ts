import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import { uploadDocument, downloadDocument, deleteDocument } from '../services/document.service.js';
import { documentUploadSchema } from '../validations/document.validation.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];

export const documentRouter = Router();

// Student document upload
documentRouter.post(
  '/student',
  ...studentAccess,
  upload.single('file'),
  async (request, response) => {
    const result = documentUploadSchema.safeParse({
      documentType: request.body.documentType,
    });

    if (!result.success) {
      throw new AppError('Invalid document type.', 400, 'INVALID_DOCUMENT_TYPE');
    }

    const uploaded = await uploadDocument({
      file: request.file!,
      documentType: result.data.documentType,
      uploadedBy: requireIdentity(request).id,
    });

    response.status(201).json({ document: uploaded });
  },
);

// Organization document upload
documentRouter.post(
  '/organization',
  ...orgAccess,
  upload.single('file'),
  async (request, response) => {
    const result = documentUploadSchema.safeParse({
      documentType: request.body.documentType,
    });

    if (!result.success) {
      throw new AppError('Invalid document type.', 400, 'INVALID_DOCUMENT_TYPE');
    }

    const uploaded = await uploadDocument({
      file: request.file!,
      documentType: result.data.documentType,
      uploadedBy: requireIdentity(request).id,
      organizationId: undefined, // Will be set from identity
    });

    response.status(201).json({ document: uploaded });
  },
);

// Download document
documentRouter.get('/:documentId/download', ...orgAccess, async (request, response) => {
  const document = await downloadDocument(new request.params.documentId());
  response.set('Content-Type', document.contentType);
  response.set(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
  );
  response.send(document);
});

// Delete document
documentRouter.delete('/:documentId', ...orgAccess, async (request, response) => {
  await deleteDocument(new request.params.documentId());
  response.status(204).end();
});
