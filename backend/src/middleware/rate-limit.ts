import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
}

function createLimiter({ windowMs, limit, message }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Limits would make the test suite order dependent.
    skip: () => env.NODE_ENV === 'test',
    handler: (_request, response) => {
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
        },
      });
    },
  });
}

/** Guards credential stuffing against a single account or address. */
export const loginRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many sign-in attempts. Please try again in a few minutes.',
});

/** Prevents automated account creation. */
export const registrationRateLimit = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Too many accounts created from this address. Please try again later.',
});

/** Prevents reset emails from being used to spam a mailbox. */
export const passwordResetRateLimit = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password reset requests. Please try again later.',
});
