import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../../errors/app-error.js';

export function validateInput(schema: z.ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    
    if (!result.success) {
      const errors = result.error.errors.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', { errors }));
    }
    
    // Replace request.body with the validated/parsed data
    request.body = result.data;
    next();
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.query);
    
    if (!result.success) {
      const errors = result.error.errors.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Query validation failed.', 400, 'VALIDATION_ERROR', { errors }));
    }
    
    request.query = result.data as z.infer<T>;
    next();
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse({
      ...request.params,
    });
    
    if (!result.success) {
      const errors = result.error.errors.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Parameter validation failed.', 400, 'VALIDATION_ERROR', { errors }));
    }
    
    request.params = result.data as z.infer<T>;
    next();
  };
}