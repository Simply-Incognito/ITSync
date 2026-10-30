import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed. Please check the issues below.',
        issues: error.issues.map(({ path, message }) => ({
          path: path.join('.'),
          message,
        })),
      },
    });
    return;
  }

  const appError = error instanceof AppError ? error : null;
  const statusCode = appError?.statusCode ?? 500;
  const code = appError?.code ?? 'INTERNAL_SERVER_ERROR';
  const message = appError?.message ?? 'An unexpected error occurred.';

  if (statusCode >= 500) {
    logger.error({ err: error }, 'Request failed with a server error');
  }

  response.status(statusCode).json({
    error: {
      code,
      message,
      ...(env.NODE_ENV !== 'production' && error instanceof Error ? { detail: error.message } : {}),
    },
  });
};
