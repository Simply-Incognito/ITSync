import { Router, type Request } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import { AppError } from '../../../errors/app-error.js';
import { routeParam } from '../../../utils/route-param.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  deleteDocument,
  downloadDocument,
  uploadOrganizationDocument,
  uploadStudentDocument,
} from '../services/document.service.js';
import { documentUploadSchema } from '../validations/document.validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 },
});

function requireIdentity(request: Request) {
  if (!request.identity) {
    throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  }

  return request.identity;
}

function requireFile(request: Request) {
  if (!request.file) {
    throw new AppError('A document file is required.', 400, 'FILE_REQUIRED');
  }

  return request.file;
}

function parseDocumentId(request: Request) {
  const documentId = routeParam(request, 'documentId', {
    code: 'DOCUMENT_NOT_FOUND',
    message: 'Document was not found.',
  });

  if (!Types.ObjectId.isValid(documentId)) {
    throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  return new Types.ObjectId(documentId);
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];

export const documentRouter = Router();

documentRouter.post(
  '/student',
  ...studentAccess,
  upload.single('file'),
  async (request, response) => {
    const input = documentUploadSchema.parse({
      documentType: request.body.documentType,
    });

    const document = await uploadStudentDocument({
      file: requireFile(request),
      documentType: input.documentType,
      uploadedBy: new Types.ObjectId(requireIdentity(request).id),
    });

    response.status(201).json({ document });
  },
);

documentRouter.post(
  '/organization',
  ...orgAccess,
  upload.single('file'),
  async (request, response) => {
    const input = documentUploadSchema.parse({
      documentType: request.body.documentType,
    });

    const document = await uploadOrganizationDocument({
      file: requireFile(request),
      documentType: input.documentType,
      uploadedBy: new Types.ObjectId(requireIdentity(request).id),
    });

    response.status(201).json({ document });
  },
);

documentRouter.get('/:documentId/download', ...orgAccess, async (request, response) => {
  const document = await downloadDocument(parseDocumentId(request));

  response.set('Content-Type', document.contentType);
  response.set(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
  );
  response.send(document.buffer);
});

documentRouter.delete('/:documentId', ...orgAccess, async (request, response) => {
  await deleteDocument(parseDocumentId(request));
  response.status(204).end();
});
