import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import { requireVerifiedOrganization } from '../../organizations/middleware/require-verified-organization.js';
import { opportunityStatuses, type OpportunityStatus } from '../models/opportunity.model.js';
import {
  approveOpportunity,
  closeMyOpportunity,
  createOpportunity,
  getMyOpportunity,
  getOpportunityReview,
  getPublishedOpportunity,
  listMyOpportunities,
  listOpportunitiesForReview,
  listPublishedOpportunities,
  rejectOpportunity,
  submitMyOpportunity,
  suspendOpportunity,
  updateMyOpportunity,
} from '../services/opportunity.service.js';
import {
  opportunityCreateSchema,
  opportunityReasonSchema,
  opportunityUpdateSchema,
} from '../validations/opportunity.validation.js';

export const opportunityRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

function requireOrganizationId(request: Request) {
  if (!request.organizationId) {
    throw new AppError(
      'A verified organization profile is required.',
      403,
      'ORGANIZATION_NOT_VERIFIED',
    );
  }
  return request.organizationId;
}

function routeParam(request: Request, name: string) {
  const value = request.params[name];
  if (typeof value !== 'string') {
    throw new AppError('Opportunity was not found.', 404, 'OPPORTUNITY_NOT_FOUND');
  }
  return value;
}

const representativeAccess = [
  requireAuthentication,
  requireRoles('organization_representative'),
  requireVerifiedOrganization,
];

opportunityRouter.post('/me', ...representativeAccess, async (request, response) => {
  const input = opportunityCreateSchema.parse(request.body);
  const opportunity = await createOpportunity(
    requireOrganizationId(request),
    requireIdentity(request).id,
    input,
  );
  response.status(201).json({ opportunity });
});

opportunityRouter.get('/me', ...representativeAccess, async (request, response) => {
  response.json({ opportunities: await listMyOpportunities(requireOrganizationId(request)) });
});

opportunityRouter.get('/me/:opportunityId', ...representativeAccess, async (request, response) => {
  response.json({
    opportunity: await getMyOpportunity(
      routeParam(request, 'opportunityId'),
      requireOrganizationId(request),
    ),
  });
});

opportunityRouter.patch(
  '/me/:opportunityId',
  ...representativeAccess,
  async (request, response) => {
    const input = opportunityUpdateSchema.parse(request.body);
    const opportunity = await updateMyOpportunity(
      routeParam(request, 'opportunityId'),
      requireOrganizationId(request),
      input,
    );
    response.json({ opportunity });
  },
);

opportunityRouter.post(
  '/me/:opportunityId/submit',
  ...representativeAccess,
  async (request, response) => {
    const opportunity = await submitMyOpportunity(
      routeParam(request, 'opportunityId'),
      requireOrganizationId(request),
      requireIdentity(request).id,
    );
    response.json({ opportunity });
  },
);

opportunityRouter.post(
  '/me/:opportunityId/close',
  ...representativeAccess,
  async (request, response) => {
    const opportunity = await closeMyOpportunity(
      routeParam(request, 'opportunityId'),
      requireOrganizationId(request),
      requireIdentity(request).id,
    );
    response.json({ opportunity });
  },
);

opportunityRouter.get(
  '/admin/opportunities',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const statusValue = request.query.status;
    if (
      statusValue !== undefined &&
      (typeof statusValue !== 'string' ||
        !opportunityStatuses.includes(statusValue as OpportunityStatus))
    ) {
      throw new AppError('Invalid opportunity status.', 400, 'VALIDATION_ERROR');
    }
    response.json({
      opportunities: await listOpportunitiesForReview(statusValue as OpportunityStatus | undefined),
    });
  },
);

opportunityRouter.get(
  '/admin/opportunities/:opportunityId',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    response.json(await getOpportunityReview(routeParam(request, 'opportunityId')));
  },
);

opportunityRouter.post(
  '/admin/opportunities/:opportunityId/approve',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const note = request.body?.note;
    if (note !== undefined && (typeof note !== 'string' || note.trim().length > 2000)) {
      throw new AppError('Invalid review note.', 400, 'VALIDATION_ERROR');
    }
    const opportunity = await approveOpportunity(
      routeParam(request, 'opportunityId'),
      requireIdentity(request).id,
      note?.trim() ?? '',
    );
    response.json({ opportunity });
  },
);

opportunityRouter.post(
  '/admin/opportunities/:opportunityId/reject',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const { reason } = opportunityReasonSchema.parse(request.body);
    const opportunity = await rejectOpportunity(
      routeParam(request, 'opportunityId'),
      requireIdentity(request).id,
      reason,
    );
    response.json({ opportunity });
  },
);

opportunityRouter.post(
  '/admin/opportunities/:opportunityId/suspend',
  requireAuthentication,
  requireRoles('administrator'),
  async (request, response) => {
    const { reason } = opportunityReasonSchema.parse(request.body);
    const opportunity = await suspendOpportunity(
      routeParam(request, 'opportunityId'),
      requireIdentity(request).id,
      reason,
    );
    response.json({ opportunity });
  },
);

opportunityRouter.get('/', async (_request, response) => {
  response.json({ opportunities: await listPublishedOpportunities() });
});

opportunityRouter.get('/:opportunityId', async (request, response) => {
  response.json({
    opportunity: await getPublishedOpportunity(routeParam(request, 'opportunityId')),
  });
});
