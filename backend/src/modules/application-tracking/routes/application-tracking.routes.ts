import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  getStudentDashboard,
  getOrganizationDashboard,
  getApplicationReview,
  getApplicationStatusHistory,
} from '../services/application-tracking.service.js';

export const applicationTrackingRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];
const orgAccess = [requireAuthentication, requireRoles('organization_representative')];
const adminAccess = [requireAuthentication, requireRoles('administrator')];

applicationTrackingRouter.get(
  '/me',
  ...studentAccess,
  async (request, response) => {
    const dashboard = await getStudentDashboard(requireIdentity(request));
    response.json({ dashboard });
  },
);

applicationTrackingRouter.get(
  '/organization/me',
  ...orgAccess,
  async (request, response) => {
    const dashboard = await getOrganizationDashboard(
      request.identity.id,
      requireIdentity(request),
    );
    response.json({ dashboard });
  },
);

applicationTrackingRouter.get(
  '/:applicationId',
  ...adminAccess,
  async (request, response) => {
    const { applicationId } = request.params;
    const result = await getApplicationReview(applicationId);
    response.json(result);
  },
);

applicationTrackingRouter.get(
  '/:applicationId/history',
  ...adminAccess,
  async (request, response) => {
    const { applicationId } = request.params;
    const history = await getApplicationStatusHistory(applicationId);
    response.json({ history });
  },
);