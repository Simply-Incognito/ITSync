import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { retryWithExponentialBackoff } from '../utils/retry.js';

export async function connectToDatabase(): Promise<void> {
  await retryWithExponentialBackoff(() => mongoose.connect(env.MONGODB_URI), {
    onRetry: (error, attempt, delayMs) => {
      logger.warn(
        { err: error, attempt, delayMs },
        'Database connection failed; retrying with exponential backoff',
      );
    },
  });
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
