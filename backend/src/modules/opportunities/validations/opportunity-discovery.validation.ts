import { z } from 'zod';

export const opportunitySearchSchema = z
  .object({
    search: z.string().trim().min(1).max(200).optional(),
    fieldOfStudy: z.string().trim().min(1).max(160).optional(),
    industry: z.string().trim().min(1).max(120).optional(),
    location: z.string().trim().min(1).max(120).optional(),
    durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
    workArrangement: z.enum(['onsite', 'hybrid', 'remote']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type OpportunitySearchInput = z.infer<typeof opportunitySearchSchema>;
