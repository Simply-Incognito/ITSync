import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase, disconnectFromDatabase } from './database/mongoose.js';

const app = createApp();
const shutdownTimeoutMs = 10_000;

async function startServer(): Promise<void> {
  await connectToDatabase();

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT }, 'Server API listening');
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutdown signal received');

    // Never let an open connection keep the process alive indefinitely.
    setTimeout(() => {
      logger.error('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, shutdownTimeoutMs).unref();

    server.close(() => {
      void disconnectFromDatabase().finally(() => process.exit(0));
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start Server API');
  process.exit(1);
});
