'use strict';

import dotenv from 'dotenv';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectToDatabase, disconnectFromDatabase } from './database/mongoose.js';

const app = createApp();

async function startServer(): Promise<void> {
  // Load environment variables from .env file
  dotenv.config({ path: '.env' });

  // Set the NODE_ENV environment variable to 'development' if it is not already set
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  // Connect to the database
  await connectToDatabase();

  // Start the server and listen for incoming requests
  const server = app.listen(env.PORT, env.HOST, () => {
    console.info(`Server API listening on http://${env.HOST}:${env.PORT}`);
    console.info(`OpenAPI docs: http://${env.HOST}:${env.PORT}/api/v1/docs`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down gracefully.`);

    server.close(() => {
      void disconnectFromDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Start the server and handle any errors that occur during startup
startServer().catch((error: unknown) => {
  console.error('Failed to start Server API:', error);
  process.exit(1);
});
