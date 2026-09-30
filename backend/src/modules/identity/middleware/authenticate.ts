import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { authenticate } from '../services/auth.service.js';
import type { UserRole } from '../models/user.model.js';

export async function requireAuthentication(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const match = request.get('authorization')?.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
    request.identity = await authenticate(match[1]);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.identity) {
      next(new AppError('Authentication is required.', 401, 'UNAUTHENTICATED'));
      return;
    }
    if (!roles.includes(request.identity.role)) {
      next(
        new AppError('You do not have permission to perform this action.', 403, 'ROLE_FORBIDDEN'),
      );
      return;
    }
    next();
  };
}
