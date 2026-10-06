import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import type { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import { organizationStatuses, type OrganizationStatus } from '../models/organization.model.js';
import {
  openOrganizationDocument,
  maxOrganizationDocumentBytes,
} from '../utils/document-storage.js';

import {
  organizationDocumentSchema,
  organizationProfileSchema,
  organizationProfileUpdateSchema,
  organizationReasonSchema,
  reviewOrganizationSchema,
} from '../validations/organization.validation.js';

import {
  addOrganizationDocument,
  approveOrganization,
  createOrganizationProfile,
  getMyOrganization,
  getMyOrganizationDocument,
  getOrganizationDocument,
  getOrganizationReview,
  listOrganizationsForReview,
  rejectOrganization,
  recordOrganizationDocumentAccess,
  submitOrganizationForReview,
  suspendOrganization,
  updateMyOrganizationProfile,
} from '../services/organization.service.js';

export const organizationRouter = Router();

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxOrganizationDocumentBytes, files: 1, fields: 1, parts: 2 },
}).single('file');

function handleUpload(request: Request, response: Response, next: NextFunction) {
  uploadDocument(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      next(
        new AppError(
          tooLarge ? 'Documents must be no larger than 5 MB.' : 'Invalid document upload.',
          tooLarge ? 413 : 400,
          tooLarge ? 'INVALID_DOCUMENT_SIZE' : 'INVALID_DOCUMENT_UPLOAD',
        ),
      );
      return;
    }
    next(error);
  });
}

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

function routeParam(request: Request, name: string) {
  const value = request.params[name];
  if (typeof value !== 'string') {
    throw new AppError('Resource was not found.', 404, 'RESOURCE_NOT_FOUND');
  }
  return value;
}

function requireUploadedFile(request: Request) {
  if (!request.file) throw new AppError('A document file is required.', 400, 'DOCUMENT_REQUIRED');
  return request.file;
}

function sendDocument(
  response: Response,
  document: { storageId: Types.ObjectId; contentType: string; originalName: string },
  next: NextFunction,
) {
  response.setHeader('Content-Type', document.contentType);
  response.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
  );
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  openOrganizationDocument(document.storageId).on('error', next).pipe(response);
}

organizationRouter.post(
  '/',
  requireAuthentication,
  requireRoles('organization_representative'),
  async (request, response) => {
    const input = organizationProfileSchema.parse(request.body);
    const organization = await createOrganizationProfile(requireIdentity(request).id, input);
    response.status(201).json({ organization });
  },
);

organizationRouter.get(
  '/me',
  requireAuthentication,
  requireRoles('organization_representative'),
  async (request, response) => {
    response.json(await getMyOrganization(requireIdentity(request).id));
  },
);

organizationRouter.patch(
  '/me',
  requireAuthentication,
  requireRoles('organization_representative'),
  async (request, response) => {
    const input = organizationProfileUpdateSchema.parse(request.body);
    const organization = await updateMyOrganizationProfile(requireIdentity(request).id, input);
    response.json({ organization });
  },
);

organizationRouter.post(
  '/me/documents',
  requireAuthentication,
  requireRoles('organization_representative'),
  handleUpload,
  async (request, response) => {
    const { documentType } = organizationDocumentSchema.parse({
      documentType: request.body.documentType,
    });
    const document = await addOrganizationDocument(
      requireIdentity(request).id,
      documentType,
      requireUploadedFile(request),
    );
    response.status(201).json({
      document: {
        id: String(document._id),
        documentType: document.documentType,
        originalName: document.originalName,
        contentType: document.contentType,
        byteSize: document.byteSize,
        uploadedAt: document.createdAt,
      },
    });
  },
);

organizationRouter.get(
  '/me/documents/:documentId',
  requireAuthentication,
  requireRoles('organization_representative'),
  async (request, response, next) => {
    const document = await getMyOrganizationDocument(
      requireIdentity(request).id,
      routeParam(request, 'documentId'),
    );
    await recordOrganizationDocumentAccess(
      String(document.organizationId),
      document._id,
      requireIdentity(request).id,
    );
    sendDocument(response, document, next);
  },
);

organizationRouter.post(
  '/me/verification',
  requireAuthentication,
  requireRoles('organization_representative'),
  async (request, response) => {
    const organization = await submitOrganizationForReview(requireIdentity(request).id);
    response.json({ organization });
  },
);

organizationRouter.get(
  '/admin/organizations',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const statusValue = request.query.status;
    if (
      statusValue !== undefined &&
      (typeof statusValue !== 'string' ||
        !organizationStatuses.includes(statusValue as OrganizationStatus))
    ) {
      throw new AppError('Invalid organization status.', 400, 'VALIDATION_ERROR');
    }
    response.json({
      organizations: await listOrganizationsForReview(
        statusValue as OrganizationStatus | undefined,
      ),
    });
  },
);

organizationRouter.get(
  '/admin/organizations/:organizationId',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    response.json(await getOrganizationReview(routeParam(request, 'organizationId')));
  },
);

organizationRouter.get(
  '/admin/organizations/:organizationId/documents/:documentId',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response, next) => {
    const document = await getOrganizationDocument(
      routeParam(request, 'organizationId'),
      routeParam(request, 'documentId'),
    );
    await recordOrganizationDocumentAccess(
      String(document.organizationId),
      document._id,
      requireIdentity(request).id,
    );
    sendDocument(response, document, next);
  },
);

organizationRouter.post(
  '/admin/organizations/:organizationId/approve',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const input = reviewOrganizationSchema.parse(request.body);
    const organization = await approveOrganization(
      routeParam(request, 'organizationId'),
      requireIdentity(request).id,
      input,
    );
    response.json({ organization });
  },
);

organizationRouter.post(
  '/admin/organizations/:organizationId/reject',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const { reason } = organizationReasonSchema.parse(request.body);
    const organization = await rejectOrganization(
      routeParam(request, 'organizationId'),
      requireIdentity(request).id,
      reason,
    );
    response.json({ organization });
  },
);

organizationRouter.post(
  '/admin/organizations/:organizationId/suspend',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const { reason } = organizationReasonSchema.parse(request.body);
    const organization = await suspendOrganization(
      routeParam(request, 'organizationId'),
      requireIdentity(request).id,
      reason,
    );
    response.json({ organization });
  },
);
