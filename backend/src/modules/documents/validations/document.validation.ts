import { z } from 'zod';

export const documentUploadSchema = z
  .object({
    documentType: z.enum([
      'cac_certificate',
      'cac_status_report',
      'representative_authorization',
      'proof_of_address',
      'cv',
      'other',
    ]),
    file: z.instanceof(File).refine((file) => file instanceof File && file.size > 0, {
      message: 'A valid file is required.',
    }),
  })
  .strict();

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;