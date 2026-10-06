import { Router, type Request } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { requireAuthentication, requireRoles } from '../../identity/middleware/authenticate.js';
import {
  createStudentProfile,
  deleteStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from '../services/student.service.js';
import {
  studentProfileCreateSchema,
  studentProfileUpdateSchema,
} from '../validations/student.validation.js';

export const studentRouter = Router();

function requireIdentity(request: Request) {
  if (!request.identity) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED');
  return request.identity;
}

const studentAccess = [requireAuthentication, requireRoles('student')];

studentRouter.get('/me', ...studentAccess, async (request, response) => {
  const student = await getStudentProfile(requireIdentity(request).id);
  response.json({ student });
});

studentRouter.post('/me', ...studentAccess, async (request, response) => {
  const input = studentProfileCreateSchema.parse(request.body);
  const student = await createStudentProfile(requireIdentity(request).id, input);
  response.status(201).json({ student });
});

studentRouter.patch('/me', ...studentAccess, async (request, response) => {
  const input = studentProfileUpdateSchema.parse(request.body);
  const student = await updateStudentProfile(requireIdentity(request).id, input);
  response.json({ student });
});

studentRouter.delete('/me', ...studentAccess, async (request, response) => {
  await deleteStudentProfile(requireIdentity(request).id);
  response.status(204).end();
});
