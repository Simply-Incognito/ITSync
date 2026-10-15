import { z } from 'zod';
import { userRoles } from '../models/user.model.js';

const studentRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().max(30).optional(),
  institution: z.string().trim().max(160).optional(),
  department: z.string().trim().max(160).optional(),
  fieldOfStudy: z.string().trim().max(160).optional(),
  currentLevel: z.string().trim().max(40).optional(),
  expectedDurationWeeks: z.number().int().min(1).max(104).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
});

const organizationRegistrationSchema = z.object({
  legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters').max(200),
  tradingName: z.string().trim().min(2).max(200).optional(),
  registrationCountry: z.string().trim().length(2).default('NG'),
  registrationNumber: z.string().trim().min(3, 'Registration number must be at least 3 characters').max(80),
  industry: z.string().trim().min(2, 'Industry must be at least 2 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(3000),
  website: z.string().trim().max(300, 'Website must be a valid URL').optional().or(z.literal('')),
  representativeName: z.string().trim().min(2, 'Representative name must be at least 2 characters').max(160),
  representativeTitle: z.string().trim().min(2, 'Representative title must be at least 2 characters').max(120),
  address: z.object({
    street: z.string().trim().min(3, 'Street must be at least 3 characters').max(200),
    city: z.string().trim().min(2, 'City must be at least 2 characters').max(120),
    state: z.string().trim().min(2, 'State must be at least 2 characters').max(120),
    country: z.string().trim().min(2, 'Country must be at least 2 characters').max(120),
    postalCode: z.string().trim().max(30).optional(),
  }),
});

export const registerSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
    role: z.enum(
      userRoles.filter((role) => role !== 'administrator') as [
        'student',
        'organization_representative',
      ],
    ),
    student: studentRegistrationSchema.optional(),
    organization: organizationRegistrationSchema.optional(),
  })
  .refine((input) => input.role !== 'student' || input.student !== undefined, {
    message: 'Student profile details are required for student accounts.',
    path: ['student'],
  })
  .refine((input) => input.role !== 'organization_representative' || input.organization !== undefined, {
    message: 'Organization profile details are required for organization accounts.',
    path: ['organization'],
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email: z.email().max(254) });

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
