import type { Request } from 'express';
import { AppError } from '../errors/app-error.js';

/**
 * Reads a named route parameter and guarantees a non-empty string.
 *
 * Express types route params as `string | string[] | undefined`, so every
 * controller must narrow before using the value.
 */
export function routeParam(
  request: Request,
  name: string,
  options: { code?: string; message?: string } = {},
): string {
  const value = request.params[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(
      options.message ?? 'The requested resource was not found.',
      404,
      options.code ?? 'RESOURCE_NOT_FOUND',
    );
  }

  return value;
}
