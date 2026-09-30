import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError('The requested resource was not found.', 404, 'NOT_FOUND'));
};
