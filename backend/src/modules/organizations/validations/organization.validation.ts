import { z } from 'zod';
import { organizationDocumentTypes } from '../models/organization-document.model.js';

const organizationProfileFields = {
  legalName: z.string().trim().min(2).max(200),
  tradingName: z.string().trim().min(2).max(200).optional(),
  registrationCountry: z.string().trim().length(2).default('NG'),
  registrationNumber: z.string().trim().min(3).max(80),
  industry: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(3000),
  website: z.union([z.url().max(300), z.literal('')]).optional(),
  representativeName: z.string().trim().min(2).max(160),
  representativeTitle: z.string().trim().min(2).max(120),
  address: z.object({
    street: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(120),
    state: z.string().trim().min(2).max(120),
    country: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().max(30).optional(),
  }),
};

export const organizationRegistrationSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
    ...organizationProfileFields,
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const organizationProfileSchema = z.object(organizationProfileFields);

export const organizationProfileUpdateSchema = organizationProfileSchema
  .extend({ registrationCountry: z.string().trim().length(2).optional() })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one profile field is required.');

export const organizationDocumentSchema = z.object({
  documentType: z.enum(organizationDocumentTypes),
});

export const reviewOrganizationSchema = z.object({
  registrySource: z.string().trim().min(2).max(200),
  registryReference: z.string().trim().min(2).max(200),
  checks: z.object({
    registryRecordFound: z.literal(true),
    legalNameAndNumberMatch: z.literal(true),
    representativeAuthorityConfirmed: z.literal(true),
    independentlySourcedContactConfirmed: z.literal(true),
    documentsAppearAuthentic: z.literal(true),
  }),
  note: z.string().trim().max(2000).optional(),
});

export const organizationReasonSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

export const organizationRiskFlagSchema = z.object({
  code: z.string().trim().min(3).max(80),
  details: z.string().trim().min(10).max(1000),
  severity: z.enum(['low', 'medium', 'high']),
});

export const resolveOrganizationRiskFlagSchema = z.object({
  note: z.string().trim().min(5).max(1000),
});

export type OrganizationRegistrationInput = z.infer<typeof organizationRegistrationSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type OrganizationProfileUpdateInput = z.infer<typeof organizationProfileUpdateSchema>;
export type OrganizationReviewInput = z.infer<typeof reviewOrganizationSchema>;
