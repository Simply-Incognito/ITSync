import pino from 'pino';
import { env } from './env.js';

/**
 * Shared structured logger.
 *
 * A single instance keeps request logging, startup output, and error reporting
 * in the same format instead of mixing pino records with plain console calls.
 */
export const logger = pino({ level: env.LOG_LEVEL });
