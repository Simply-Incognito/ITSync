import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/app-error.js';
import { feedbackRateLimit } from '../../middleware/rate-limit.js';
import { env } from '../../config/env.js';

const feedbackSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    category: z.enum(['suggestion', 'issue', 'other']),
    message: z.string().trim().min(10).max(4000),
  })
  .strict();

export const feedbackRouter = Router();

feedbackRouter.post('/', feedbackRateLimit, async (request, response) => {
  const feedback = feedbackSchema.parse(request.body);
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    throw new AppError(
      'Feedback email is not configured. Please try again later.',
      503,
      'FEEDBACK_UNAVAILABLE',
    );
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.FEEDBACK_EMAIL,
    replyTo: feedback.email || undefined,
    subject: `[ITSync Feedback] ${feedback.category}`,
    text: [
      `Category: ${feedback.category}`,
      `Name: ${feedback.name || 'Not provided'}`,
      `Email: ${feedback.email || 'Not provided'}`,
      '',
      feedback.message,
    ].join('\n'),
  });

  response.status(202).json({ message: 'Thank you. Your feedback has been sent.' });
});
