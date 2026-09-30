import 'dotenv/config';
import { z } from 'zod';

const optionalEnvString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional(),
);

const optionalEnvEmail = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .refine((value) => {
      const match = /^(?:[^\r\n<>]*<([^\r\n<>]+)>|([^\r\n<>]+))$/.exec(value);
      const address = match?.[1]?.trim() ?? match?.[2]?.trim();
      return address !== undefined && z.email().safeParse(address).success;
    }, 'Expected an email address, optionally with a display name.')
    .optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('0.0.0.0'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    WEB_APP_URL: z.url().default('http://localhost:5173'),
    SMTP_HOST: optionalEnvString,
    SMTP_PORT: z.coerce.number().int().positive().default(2525),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: optionalEnvString,
    SMTP_PASSWORD: optionalEnvString,
    SMTP_FROM: optionalEnvEmail,
  })
  .superRefine((config, context) => {
    if (Boolean(config.SMTP_HOST) !== Boolean(config.SMTP_FROM)) {
      context.addIssue({
        code: 'custom',
        message: 'SMTP_HOST and SMTP_FROM must be configured together.',
        path: ['SMTP_FROM'],
      });
    }

    if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        message: 'SMTP_USER and SMTP_PASSWORD must be configured together.',
        path: ['SMTP_PASSWORD'],
      });
    }

    if (config.SMTP_USER && !config.SMTP_HOST) {
      context.addIssue({
        code: 'custom',
        message: 'SMTP credentials require SMTP_HOST.',
        path: ['SMTP_HOST'],
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
