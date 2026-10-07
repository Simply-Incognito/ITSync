import { z } from 'zod';

const studentProfileFields = {
  fullName: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().max(30).nullable().optional(),
  institution: z.string().trim().max(160).nullable().optional(),
  department: z.string().trim().max(160).nullable().optional(),
  fieldOfStudy: z.string().trim().max(160).nullable().optional(),
  currentLevel: z.string().trim().max(40).nullable().optional(),
  expectedDurationWeeks: z.number().int().min(1).max(104).nullable().optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
};

export const studentProfileCreateSchema = z.object(studentProfileFields).strict();

export const studentProfileUpdateSchema = z
  .object(studentProfileFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one profile field must be provided.',
  });

export type StudentProfileCreateInput = z.infer<typeof studentProfileCreateSchema>;
export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;
