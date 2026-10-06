import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiDocument } from './config/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { rateLimit } from './modules/identity/middleware/rate-limit.middleware.js';
import { validateInput } from './modules/identity/middleware/validation.middleware.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/identity/routes/auth.routes.js';
import { organizationRouter } from './modules/organizations/routes/organization.routes.js';
import { applicationTrackingRouter } from './modules/application-tracking/routes/application-tracking.routes.js';
import { documentRouter } from './modules/documents/routes/document.routes.js';
import { notificationRouter } from './modules/notifications/routes/notification.routes.js';
import { administrationRouter } from './modules/administration/routes/administration.routes.js';

export function createApp() {
  const app = express();
  const logger = pino({ level: env.LOG_LEVEL });

  app.disable('x-powered-by');

  app.use(helmet());

  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }));

  app.use(express.json({ limit: '1mb' }));

  // Security middleware
  app.use(rateLimit());

  // Body validation for JSON endpoints
  app.use((request: Request, _response: Response, next: NextFunction) => {
    // Skip validation for routes that don't have bodies
    if (request.method === 'GET' || request.method === 'HEAD') {
      return next();
    }
    next();
  });

  app.use(notFoundHandler);

  app.use(errorHandler);

  app.get('/api/v1/openapi.json', (_request, response) => {
    response.json(openApiDocument);
  });

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/organizations', organizationRouter);
  app.use('/api/v1/application-tracking', applicationTrackingRouter);
  app.use('/api/v1/documents', documentRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/administration', administrationRouter);

  return app;
}