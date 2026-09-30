import type { Request, Response } from 'express';
import { AppError } from '../../../errors/app-error.js';

import {
  changePassword,
  getCurrentUser,
  login,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  revokeSession,
  updateStudentProfile,
} from '../services/auth.service.js';

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

function bearerToken(request: Request): string {
  const match = request.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return match[1];
}

export async function register(request: Request, response: Response) {
  const input = registerSchema.parse(request.body);
  response.status(201).json(await registerAccount(input));
}

export async function signIn(request: Request, response: Response) {
  const input = loginSchema.parse(request.body);
  response.json(await login(input));
}

export async function signOut(request: Request, response: Response) {
  await revokeSession(bearerToken(request));
  response.status(204).end();
}

export async function currentUser(request: Request, response: Response) {
  response.json(await getCurrentUser(requireIdentity(request)));
}

export async function forgotPassword(request: Request, response: Response) {
  const input = forgotPasswordSchema.parse(request.body);
  const result = await requestPasswordReset(input.email);
  response.status(202).json({
    message: 'If an account exists for that email, password recovery instructions will be sent.',
    ...result,
  });
}

export async function completePasswordReset(request: Request, response: Response) {
  const rawToken = request.params.token ?? request.body?.token;
  const input = resetPasswordSchema.parse({
    ...request.body,
    token: rawToken,
  });
  await resetPassword(input.token, input.password);
  response.status(204).end();
}

export async function updatePassword(request: Request, response: Response) {
  const input = changePasswordSchema.parse(request.body);
  await changePassword(requireIdentity(request), input.currentPassword, input.newPassword);
  response.status(204).end();
}

export async function studentProfile(request: Request, response: Response) {
  response.json(await updateStudentProfile(requireIdentity(request), request.body));
}
