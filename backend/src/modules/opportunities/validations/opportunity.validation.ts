import { z } from 'zod';

const futureDate = z.coerce.date().refine((date) => date.getTime() > Date.now(), {
  message: 'Application deadline must be in the future.',
});

const opportunityFields = {
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(10000),
  fieldOfStudy: z.string().trim().min(2).max(160),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  academicRequirements: z.string().trim().max(3000).default(''),
  location: z
    .object({
      city: z.string().trim().min(1).max(120),
      state: z.string().trim().min(1).max(120),
      country: z.string().trim().min(1).max(120),
    })
    .strict(),
  workArrangement: z.enum(['onsite', 'hybrid', 'remote']),
  durationWeeks: z.number().int().min(1).max(104),
  availableSlots: z.number().int().min(1).max(10000),
  applicationDeadline: futureDate,
  requiredDocuments: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  additionalRequirements: z.string().trim().max(3000).default(''),
};

export const opportunityCreateSchema = z.object(opportunityFields).strict();
export const opportunityUpdateSchema = z
  .object(opportunityFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one opportunity field must be provided.',
  });

export const opportunityReasonSchema = z
  .object({
    reason: z.string().trim().min(5).max(2000),
  })
  .strict();

export type OpportunityInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
