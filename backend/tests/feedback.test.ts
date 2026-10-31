import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mailMocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  createTransport: mailMocks.createTransport,
  default: { createTransport: mailMocks.createTransport },
}));

import { env } from '../src/config/env.js';
import { createApp } from '../src/app.js';

const app = createApp();
const originalSmtp = {
  host: env.SMTP_HOST,
  from: env.SMTP_FROM,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  user: env.SMTP_USER,
  password: env.SMTP_PASSWORD,
};

beforeEach(() => {
  vi.clearAllMocks();
  env.SMTP_HOST = 'smtp.example.test';
  env.SMTP_FROM = 'ITSync <feedback@example.test>';
  env.SMTP_PORT = 2525;
  env.SMTP_SECURE = false;
  env.SMTP_USER = undefined;
  env.SMTP_PASSWORD = undefined;
  mailMocks.sendMail.mockResolvedValue({ messageId: 'feedback-test' });
  mailMocks.createTransport.mockReturnValue({ sendMail: mailMocks.sendMail });
});

afterEach(() => {
  env.SMTP_HOST = originalSmtp.host;
  env.SMTP_FROM = originalSmtp.from;
  env.SMTP_PORT = originalSmtp.port;
  env.SMTP_SECURE = originalSmtp.secure;
  env.SMTP_USER = originalSmtp.user;
  env.SMTP_PASSWORD = originalSmtp.password;
});

describe('feedback route', () => {
  it('rejects invalid feedback details', async () => {
    const response = await request(app).post('/api/v1/feedback').send({
      category: 'not-a-category',
      message: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid reply-to email addresses', async () => {
    const response = await request(app).post('/api/v1/feedback').send({
      category: 'suggestion',
      message: 'Please add a way to filter opportunities by location.',
      email: 'not-an-email',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('emails valid feedback to the configured support inbox', async () => {
    const response = await request(app).post('/api/v1/feedback').send({
      name: 'Alex Student',
      email: 'alex@example.com',
      category: 'suggestion',
      message: 'Please add a way to filter opportunities by location.',
    });

    expect(response.status).toBe(202);
    expect(response.body.message).toContain('feedback has been sent');
    expect(mailMocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.test', port: 2525 }),
    );
    expect(mailMocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'codedynamics24@gmail.com',
        replyTo: 'alex@example.com',
        subject: '[ITSync Feedback] suggestion',
        text: expect.stringContaining('Alex Student'),
      }),
    );
  });
});
