import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/identity/models/user.model.js', () => ({
  User: { findOne: vi.fn() },
  userRoles: ['student', 'organization_representative', 'administrator'],
}));

vi.mock('../src/modules/identity/models/auth-token.model.js', () => ({
  AuthToken: { create: vi.fn() },
}));

import { createApp } from '../src/app.js';
import { AuthToken } from '../src/modules/identity/models/auth-token.model.js';
import { User } from '../src/modules/identity/models/user.model.js';
import {
  buildPasswordResetEmail,
  buildPasswordResetLink,
} from '../src/modules/identity/services/auth.service.js';
import { hashPassword, verifyPassword } from '../src/modules/identity/utils/password.js';

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('identity routes', () => {
  it('mounts authentication routes and protects the current-user endpoint', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects public administrator registration', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'admin@example.com',
      password: 'a-strong-password-123',
      role: 'administrator',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires student details for student registration', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student@example.com',
      password: 'a-strong-password-123',
      confirmPassword: 'a-strong-password-123',
      role: 'student',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires matching password confirmation when registering any role', async () => {
    const missingConfirmation = await request(app).post('/api/v1/auth/register').send({
      email: 'organization@example.com',
      password: 'a-strong-password-123',
      role: 'organization_representative',
    });
    const mismatchedConfirmation = await request(app).post('/api/v1/auth/register').send({
      email: 'organization@example.com',
      password: 'a-strong-password-123',
      confirmPassword: 'a-different-password-123',
      role: 'organization_representative',
    });

    expect(missingConfirmation.status).toBe(400);
    expect(missingConfirmation.body.error.code).toBe('VALIDATION_ERROR');
    expect(mismatchedConfirmation.status).toBe(400);
    expect(mismatchedConfirmation.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows every registered account role to log in through the shared endpoint', async () => {
    const password = 'a-strong-password-123';
    const passwordHash = await hashPassword(password);
    const roles = ['student', 'organization_representative', 'administrator'] as const;

    for (const role of roles) {
      const email = `${role}@example.com`;
      vi.mocked(User.findOne).mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          _id: `${role}-id`,
          email,
          passwordHash,
          role,
          status: 'active',
          emailVerifiedAt: null,
        }),
      } as unknown as ReturnType<typeof User.findOne>);
      vi.mocked(AuthToken.create).mockResolvedValueOnce(undefined as never);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: email.toUpperCase(),
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe(role);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(User.findOne).toHaveBeenLastCalledWith({ email });
    }
  });

  it('matches the tokenized reset route and rejects mismatched password confirmation', async () => {
    const response = await request(app)
      .post(`/api/v1/auth/password/reset/${'a'.repeat(32)}`)
      .send({
        password: 'a-strong-password-123',
        confirmPassword: 'a-different-password-123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates password recovery input before accessing the database', async () => {
    const response = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('password hashing', () => {
  it('verifies the original password without storing it in plaintext', async () => {
    const password = 'a-strong-password-123';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toContain(password);
    expect(await verifyPassword(password, passwordHash)).toBe(true);
    expect(await verifyPassword('a-different-password', passwordHash)).toBe(false);
  });
});

describe('password reset links', () => {
  it('builds a tokenized reset URL and a formatted email that expires in 10 minutes', () => {
    const token = 'reset-token-123';
    const link = buildPasswordResetLink(token);
    const email = buildPasswordResetEmail('student@example.com', link);

    expect(link).toBe('http://localhost:3000/api/v1/auth/password/reset/reset-token-123');
    expect(email.subject).toContain('Reset your iSIWES password');
    expect(email.text).toContain('/api/v1/auth/password/reset/reset-token-123');
    expect(email.text).toContain('10 minutes');
    expect(email.html).toContain('/auth/password/reset/reset-token-123');
    expect(email.html).toContain('10 minutes');
  });
});
