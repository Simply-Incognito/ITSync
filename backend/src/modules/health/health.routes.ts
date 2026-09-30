import { Router } from 'express';
import { isDatabaseReady } from '../../database/mongoose.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'isiwes-api',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_request, response) => {
  const databaseReady = isDatabaseReady();
  const statusCode = databaseReady ? 200 : 503;

  response.status(statusCode).json({
    status: databaseReady ? 'ready' : 'not_ready',
    checks: { database: databaseReady ? 'connected' : 'disconnected' },
  });
});
