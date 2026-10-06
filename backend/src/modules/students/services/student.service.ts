import { AppError } from '../../../errors/app-error.js';
import { Student, type StudentProfileInput } from '../../identity/models/student.model.js';

export async function getStudentProfile(userId: string) {
  const student = await Student.findOne({ userId }).lean();
  if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');
  return student;
}

export async function createStudentProfile(userId: string, input: StudentProfileInput) {
  try {
    return await Student.create({ userId, ...input });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        'A student profile already exists for this account.',
        409,
        'STUDENT_PROFILE_EXISTS',
      );
    }
    throw error;
  }
}

export async function updateStudentProfile(
  userId: string,
  input: Partial<StudentProfileInput>,
) {
  const student = await Student.findOneAndUpdate(
    { userId },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
  if (!student) throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');
  return student;
}

export async function deleteStudentProfile(userId: string) {
  const result = await Student.deleteOne({ userId });
  if (result.deletedCount === 0) {
    throw new AppError('Student profile not found.', 404, 'STUDENT_PROFILE_NOT_FOUND');
  }
}
