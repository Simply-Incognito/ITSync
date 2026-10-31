import { z } from 'zod';
import { organizationDocumentTypes } from '../../organizations/models/organization-document.model.js';
import { studentDocumentTypes } from '../models/student-document.model.js';

export const studentDocumentUploadSchema = z
  .object({
    documentType: z.enum(studentDocumentTypes),
  })
  .strict();

export const organizationDocumentUploadSchema = z
  .object({
    documentType: z.enum(organizationDocumentTypes),
  })
  .strict();
