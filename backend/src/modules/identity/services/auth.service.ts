import { env } from '../../../config/env.js';
import { AppError } from '../../../errors/app-error.js';
import { AuthToken } from '../models/auth-token.model.js';
import { Student, type StudentProfileInput } from '../models/student.model.js';
import { User, type UserRole } from '../models/user.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createRawToken, hashToken } from '../utils/tokens.js';
import type { LoginInput, RegisterInput } from '../validations/auth.validation.js';

const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const resetLifetimeMs = 10 * 60 * 1000;

export function buildPasswordResetLink(token: string): string {
  const baseUrl = env.WEB_APP_URL.endsWith('/') ? env.WEB_APP_URL.slice(0, -1) : env.WEB_APP_URL;
  return new URL(`/api/v1/auth/password/reset/${encodeURIComponent(token)}`, baseUrl).toString();
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

export function buildPasswordResetEmail(recipient: string, resetLink: string) {
  const safeRecipient = escapeHtml(recipient);
  const safeResetLink = escapeHtml(resetLink);
  const text = [
    `Hi ${recipient},`,
    '',
    'We received a request to reset your iSIWES password.',
    'Use the link below to create a new password. This reset link expires in 10 minutes.',
    '',
    resetLink,
    '',
    'If you did not request this password reset, you can ignore this email and your password will remain unchanged.',
  ].join('\n');

  const html = `
    <div style="margin:0; padding:40px 20px; background:#f4f7f6; font-family:Arial,Helvetica,sans-serif; color:#1f2937;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <div style="text-align:center; margin-bottom:32px;">
          <h1 style="margin:0; color:#15803d; font-size:28px; font-weight:700;">iSIWES</h1>
        </div>
        <h2 style="margin:0 0 16px; font-size:24px; color:#111827;">Reset your password</h2>
        <p style="margin:0 0 16px; font-size:15px;">Hi ${safeRecipient},</p>
        <p style="margin:0 0 20px; font-size:15px; color:#4b5563;">We received a request to reset your iSIWES password. Click the button below to create a new password.</p>
        <div style="margin:0 0 24px; padding:12px 16px; background:#f0fdf4; border-left:4px solid #16a34a; border-radius:4px;">
          <p style="margin:0; font-size:14px; color:#166534;">This password reset link expires in <strong>10 minutes</strong>.</p>
        </div>
        <div style="text-align:center; margin:28px 0;">
          <a href="${safeResetLink}" style="display:inline-block; padding:13px 28px; background:#15803d; color:#ffffff; text-decoration:none; border-radius:7px; font-size:15px; font-weight:600;">Reset my password</a>
        </div>
        <p style="margin:24px 0 0; font-size:14px; color:#6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
        <div style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center;">
          <p style="margin:0; font-size:12px; color:#9ca3af;">&copy; iSIWES. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  return {
    subject: 'Reset your iSIWES password',
    text,
    html,
  };
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerifiedAt?: Date | null;
}

export interface AuthenticatedIdentity {
  id: string;
  email: string;
  role: UserRole;
}

function toPublicUser(user: {
  _id: unknown;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerifiedAt?: Date | null;
}): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
  };
}

async function issueSession(userId: string): Promise<string> {
  const token = createRawToken();
  await AuthToken.create({
    userId,
    tokenHash: hashToken(token),
    purpose: 'session',
    expiresAt: new Date(Date.now() + sessionLifetimeMs),
  });
  return token;
}

export async function registerAccount(input: RegisterInput) {
  let user;
  try {
    user = await User.create({
      email: input.email.trim().toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        'An account with this email already exists.',
        409,
        'EMAIL_ALREADY_REGISTERED',
      );
    }
    throw error;
  }

  try {
    if (input.role === 'student' && input.student) {
      await Student.create({ userId: user._id, ...input.student });
    }
    const accessToken = await issueSession(String(user._id));
    return { user: toPublicUser(user), accessToken };
  } catch (error) {
    await Student.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email.trim().toLowerCase() }).select(
    '+passwordHash',
  );
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'active') {
    throw new AppError('This account is unavailable.', 403, 'ACCOUNT_UNAVAILABLE');
  }

  return { user: toPublicUser(user), accessToken: await issueSession(String(user._id)) };
}

export async function authenticate(token: string): Promise<AuthenticatedIdentity> {
  const authToken = await AuthToken.findOne({
    tokenHash: hashToken(token),
    purpose: 'session',
    expiresAt: { $gt: new Date() },
  });
  if (!authToken) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');

  const user = await User.findById(authToken.userId);
  if (!user || user.status !== 'active') {
    throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  }
  return { id: String(user._id), email: user.email, role: user.role };
}

export async function revokeSession(token: string): Promise<void> {
  await AuthToken.deleteOne({ tokenHash: hashToken(token), purpose: 'session' });
}

export async function requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
  if (env.NODE_ENV === 'production' && !(env.SMTP_HOST && env.SMTP_FROM)) {
    throw new AppError('Password recovery email is not configured.', 503, 'RECOVERY_UNAVAILABLE');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return {};

  const resetToken = createRawToken();
  await AuthToken.deleteMany({ userId: user._id, purpose: 'password_reset' });
  await AuthToken.create({
    userId: user._id,
    tokenHash: hashToken(resetToken),
    purpose: 'password_reset',
    expiresAt: new Date(Date.now() + resetLifetimeMs),
  });

  if (env.SMTP_HOST && env.SMTP_FROM) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        ...(env.SMTP_USER && env.SMTP_PASSWORD
          ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
          : {}),
      });
      const resetUrl = buildPasswordResetLink(resetToken);
      const emailTemplate = buildPasswordResetEmail(user.email, resetUrl);
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
    } catch (error) {
      await AuthToken.deleteOne({ tokenHash: hashToken(resetToken), purpose: 'password_reset' });
      const smtpError =
        error instanceof Error
          ? (error as Error & { code?: string; responseCode?: number; command?: string })
          : undefined;
      console.error('Password recovery email delivery failed.', {
        code: smtpError?.code,
        responseCode: smtpError?.responseCode,
        command: smtpError?.command,
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
      });
    }
    return {};
  }

  return { resetToken };
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const authToken = await AuthToken.findOneAndDelete({
    tokenHash: hashToken(token),
    purpose: 'password_reset',
    expiresAt: { $gt: new Date() },
  });
  if (!authToken)
    throw new AppError(
      'The password reset token is invalid or expired.',
      400,
      'INVALID_RESET_TOKEN',
    );

  const user = await User.findById(authToken.userId);
  if (!user || user.status !== 'active') {
    throw new AppError(
      'The password reset token is invalid or expired.',
      400,
      'INVALID_RESET_TOKEN',
    );
  }
  user.passwordHash = await hashPassword(password);
  await user.save();
  await AuthToken.deleteMany({ userId: user._id });
}

export async function changePassword(
  identity: AuthenticatedIdentity,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(identity.id).select('+passwordHash');
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await AuthToken.deleteMany({ userId: user._id, purpose: 'session' });
}

export async function getCurrentUser(identity: AuthenticatedIdentity) {
  const user = await User.findById(identity.id);
  if (!user) throw new AppError('Account not found.', 404, 'ACCOUNT_NOT_FOUND');
  const student =
    user.role === 'student' ? await Student.findOne({ userId: user._id }).lean() : null;
  return { user: toPublicUser(user), student };
}

export async function updateStudentProfile(
  identity: AuthenticatedIdentity,
  profile: Partial<StudentProfileInput>,
) {
  if (identity.role !== 'student') {
    throw new AppError('This action is only available to student accounts.', 403, 'ROLE_FORBIDDEN');
  }
  const student = await Student.findOneAndUpdate(
    { userId: identity.id },
    { $set: profile },
    { new: true, runValidators: true },
  ).lean();
  if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');
  return student;
}
