import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
} from '../services/application.service.js';
import { updateApplicationStatusSchema } from '../validations/application.validation.js';

export const applicationRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];
const adminAccess = [requireAuthentication, requireRoles('administrator')];

applicationRouter.post(
  '/',
  ...studentAccess,
  async (request, response) => {
    const input = request.body as {
      opportunityId: string;
      studentDocumentIds?: string[];
    };
    const studentId = requireIdentity(request).id;

    const result = await createApplication(
      {
        studentId: new Types.ObjectId(requireIdentity(request).id),
        opportunityId: new Types.ObjectId(input.opportunityId),
        studentDocumentIds: input.studentDocumentIds,
      },
      studentId,
    );
    response.status(201).json({ application: result });
  },
);

applicationRouter.get(
  '/my',
  ...studentAccess,
  async (request, response) => {
    const filters = { studentId: requireIdentity(request).id };
    const result = await listApplications(filters, requireIdentity(request).id);
    response.json({ applications: result.applications, pagination: result.pagination });
  },
);

applicationRouter.get(
  '/',
  ...adminAccess,
  async (request, response) => {
    const filters = { status: request.query.status as string };
    const result = await listApplications(filters, request.identity?.id || '');
    response.json({ applications: result.applications, pagination: result.pagination });
  },
);

applicationRouter.patch(
  '/:applicationId/status',
  ...adminAccess,
  async (request, response) => {
    const input = updateApplicationStatusSchema.parse(request.body);
    const application = await updateApplicationStatus(
      new Types.ObjectId(request.params.applicationId),
      input.status,
      requireIdentity(request).id,
      input.reason,
    );
    response.json({ application });
  },
);

applicationRouter.get(
  '/me/:opportunityId',
  ...studentAccess,
  async (request, response) => {
    const filters = { studentId: requireIdentity(request).id, opportunityId: request.params.opportunityId };
    const result = await listApplications(filters, requireIdentity(request).id);
    response.json({ applications: result.applications });
  },
);