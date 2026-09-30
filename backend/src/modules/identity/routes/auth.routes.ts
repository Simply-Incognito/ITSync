import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../../middleware/validate-body.js';
import {
  completePasswordReset,
  currentUser,
  forgotPassword,
  register,
  signIn,
  signOut,
  studentProfile,
  updatePassword,
} from '../controllers/auth.controller.js';
import { requireAuthentication, requireRoles } from '../middleware/authenticate.js';
import { registerSchema } from '../validations/auth.validation.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);

authRouter.post('/login', signIn);

authRouter.post('/logout', requireAuthentication, signOut);

authRouter.get('/me', requireAuthentication, currentUser);

authRouter.post('/password/forgot', forgotPassword);

authRouter.post('/password/reset', completePasswordReset);

authRouter.post('/password/reset/:token', completePasswordReset);

authRouter.put('/password', requireAuthentication, updatePassword);

authRouter.patch(
  '/student-profile',
  requireAuthentication,
  requireRoles('student'),
  validateBody(
    z
      .object({
        fullName: z.string().trim().min(2).max(120).optional(),
        phoneNumber: z.string().trim().max(30).nullable().optional(),
        institution: z.string().trim().max(160).nullable().optional(),
        department: z.string().trim().max(160).nullable().optional(),
        fieldOfStudy: z.string().trim().max(160).nullable().optional(),
        currentLevel: z.string().trim().max(40).nullable().optional(),
        expectedDurationWeeks: z.number().int().min(1).max(104).nullable().optional(),
        preferredLocations: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
        skills: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
      })
      .strict()
      .refine((input) => Object.keys(input).length > 0, 'At least one profile field is required.'),
  ),
  studentProfile,
);
