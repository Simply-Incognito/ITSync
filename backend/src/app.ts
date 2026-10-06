import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiDocument } from './config/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/identity/routes/auth.routes.js';
import { organizationRouter } from './modules/organizations/routes/organization.routes.js';
import { applicationTrackingRouter } from './modules/application-tracking/routes/application-tracking.routes.js';
import { documentRouter } from './modules/documents/routes/document.routes.js';
import { studentRouter } from './modules/students/routes/student.routes.js';
import { opportunityRouter } from './modules/opportunities/routes/opportunity.routes.js';

export function createApp() {
  const app = express();
  const logger = pino({ level: env.LOG_LEVEL });

  app.disable('x-powered-by');

  app.use(helmet());

  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }));

  app.use(express.json({ limit: '1mb' }));

  app.use((request, response, next) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      logger.info(
        {
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        },
        'HTTP request',
      );
    });

    next();
  });

  app.get('/api/v1/openapi.json', (_request, response) => {
    response.json(openApiDocument);
  });

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/organizations', organizationRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/application-tracking', applicationTrackingRouter);
  app.use('/api/v1/documents', documentRouter);
  app.use('/api/v1/applications', applicationRouter);
  app.use('/api/v1/students', studentRouter);
  app.use('/api/v1/opportunities', opportunityRouter);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
