import { Router, type Request } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { routeParam } from '../../../utils/route-param.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import { applicationStatuses, type ApplicationStatus } from '../models/application.model.js';
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
} from '../services/application.service.js';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from '../validations/application.validation.js';

export const applicationRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) {
    throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  }

  return request.identity;
}

function parseObjectId(value: string | undefined, message: string, code: string) {
  if (!value || !Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }

  return new Types.ObjectId(value);
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];
const adminAccess = [requireAuthentication, requireRoles('administrator')];

function paginationValue(value: unknown, fallback: number, name: string, maximum: number) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new AppError(`Invalid ${name}.`, 400, 'INVALID_PAGINATION');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new AppError(`Invalid ${name}.`, 400, 'INVALID_PAGINATION');
  }
  return parsed;
}

applicationRouter.post('/', ...studentAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const input = createApplicationSchema.parse(request.body);

  const result = await createApplication(
    {
      studentId: new Types.ObjectId(identity.id),
      opportunityId: parseObjectId(
        input.opportunityId,
        'A valid opportunityId is required.',
        'INVALID_OPPORTUNITY_ID',
      ),
      studentDocumentIds: input.studentDocumentIds.map((documentId) =>
        parseObjectId(documentId, 'A valid document id is required.', 'INVALID_DOCUMENT_ID'),
      ),
    },
    identity.id,
  );

  response.status(201).json({ application: result });
});

applicationRouter.get('/my', ...studentAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const page = paginationValue(request.query.page, 1, 'page', 100_000);
  const limit = paginationValue(request.query.limit, 20, 'limit', 100);
  const result = await listApplications(
    { studentId: new Types.ObjectId(identity.id), page, limit },
    identity.id,
  );

  response.json({ applications: result.applications, pagination: result.pagination });
});

applicationRouter.get('/', ...adminAccess, async (request, response) => {
  const statusValue = request.query.status;
  if (
    statusValue !== undefined &&
    (typeof statusValue !== 'string' ||
      !applicationStatuses.includes(statusValue as ApplicationStatus))
  ) {
    throw new AppError('Invalid application status.', 400, 'INVALID_APPLICATION_STATUS');
  }
  const status = statusValue as ApplicationStatus | undefined;
  const page = paginationValue(request.query.page, 1, 'page', 100_000);
  const limit = paginationValue(request.query.limit, 20, 'limit', 100);

  const result = await listApplications({ status, page, limit }, requireIdentity(request).id);
  response.json({ applications: result.applications, pagination: result.pagination });
});

applicationRouter.get('/organization/me', ...orgAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const result = await listApplications({}, identity.id);

  response.json({ applications: result.applications, pagination: result.pagination });
});

applicationRouter.patch(
  '/:applicationId/status',
  ...adminAccess,
  async (request, response) => {
    const input = updateApplicationStatusSchema.parse(request.body);
    const applicationId = parseObjectId(
      routeParam(request, 'applicationId', {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application was not found.',
      }),
      'Application was not found.',
      'APPLICATION_NOT_FOUND',
    );

    const application = await updateApplicationStatus(
      applicationId,
      input.status,
      requireIdentity(request).id,
      input.reason,
    );

    response.json({ application });
  },
);

applicationRouter.get('/me/:opportunityId', ...studentAccess, async (request, response) => {
  const identity = requireIdentity(request);
  const opportunityId = parseObjectId(
    routeParam(request, 'opportunityId', {
      code: 'OPPORTUNITY_NOT_FOUND',
      message: 'Opportunity was not found.',
    }),
    'Opportunity was not found.',
    'OPPORTUNITY_NOT_FOUND',
  );

  const result = await listApplications(
    { studentId: new Types.ObjectId(identity.id), opportunityId },
    identity.id,
  );

  response.json({ applications: result.applications });
});
