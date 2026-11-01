import { z } from 'zod';

export const applicationStatusSchema = z.enum([
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const createApplicationSchema = z
  .object({
    opportunityId: z.string().min(1).max(64),
    studentDocumentIds: z.array(z.string().min(1).max(64)).length(1),
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({
    status: applicationStatusSchema,
    reason: z.string().trim().min(5).max(2000).optional(),
  })
  .refine((input) => input.status !== 'rejected' || Boolean(input.reason), {
    message: 'A reason is required when rejecting an application.',
    path: ['reason'],
  });

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;