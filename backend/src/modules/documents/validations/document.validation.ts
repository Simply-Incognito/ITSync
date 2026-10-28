import { z } from 'zod';
import { documentTypes } from '../services/document.service.js';

export const documentUploadSchema = z
  .object({
    documentType: z.enum(documentTypes),
  })
  .strict();

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
