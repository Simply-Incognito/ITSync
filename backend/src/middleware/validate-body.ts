import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function validateBody(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    request.body = result.data;
    next();
  };
}
