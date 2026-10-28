import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { Organization } from '../models/organization.model.js';

export async function requireVerifiedOrganization(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    if (!request.identity) {
      throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
    }
    if (request.identity.role !== 'organization_representative') {
      throw new AppError('Organization representative role required.', 403, 'ROLE_FORBIDDEN');
    }

    const organization = await Organization.findOne({
      representativeUserId: request.identity.id,
      verificationStatus: 'verified',
    }).select('_id');
    if (!organization) {
      throw new AppError(
        'A verified organization profile is required for this action.',
        403,
        'ORGANIZATION_NOT_VERIFIED',
      );
    }

    request.organizationId = String(organization._id);
    next();
  } catch (error) {
    next(error);
  }
}
