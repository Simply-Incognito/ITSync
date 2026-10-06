import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authenticate, studentService } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  studentService: {
    createStudentProfile: vi.fn(),
    deleteStudentProfile: vi.fn(),
    getStudentProfile: vi.fn(),
    updateStudentProfile: vi.fn(),
  },
}));

vi.mock('../src/modules/identity/services/auth.service.js', () => ({ authenticate }));
vi.mock('../src/modules/students/services/student.service.js', () => studentService);

import { createApp } from '../src/app.js';
import { studentProfileCreateSchema } from '../src/modules/students/validations/student.validation.js';

const app = createApp();

const validProfile = {
  fullName: 'John Doe',
  phoneNumber: '+2341234567890',
  institution: 'University of Lagos',
  department: 'Computer Science',
  fieldOfStudy: 'Computer Science',
  currentLevel: '300',
  expectedDurationWeeks: 24,
  preferredLocations: ['Lagos', 'Abuja'],
  skills: ['JavaScript', 'TypeScript', 'React'],
};

describe('student routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentService.getStudentProfile.mockResolvedValue({ _id: 'student-1', ...validProfile });
    studentService.createStudentProfile.mockResolvedValue({ _id: 'student-1', ...validProfile });
    studentService.updateStudentProfile.mockResolvedValue({ _id: 'student-1', ...validProfile });
    studentService.deleteStudentProfile.mockResolvedValue(undefined);
  });

  it('allows a student to get their profile', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a201',
      email: 'student@example.test',
      role: 'student',
    });

    const response = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', 'Bearer student-token');

    expect(response.status).toBe(200);
    expect(response.body.student).toMatchObject({ fullName: validProfile.fullName });
    expect(studentService.getStudentProfile).toHaveBeenCalledWith('68d2c50a8c4e1c843a39a201');
  });

  it('allows a student to create their profile', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a201',
      email: 'student@example.test',
      role: 'student',
    });

    const response = await request(app)
      .post('/api/v1/students/me')
      .set('Authorization', 'Bearer student-token')
      .send(validProfile);

    expect(response.status).toBe(201);
    expect(response.body.student).toMatchObject({ fullName: validProfile.fullName });
    expect(studentService.createStudentProfile).toHaveBeenCalledWith(
      '68d2c50a8c4e1c843a39a201',
      validProfile,
    );
  });

  it('allows a student to update their profile', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a201',
      email: 'student@example.test',
      role: 'student',
    });

    const response = await request(app)
      .patch('/api/v1/students/me')
      .set('Authorization', 'Bearer student-token')
      .send({ fullName: 'Jane Doe' });

    expect(response.status).toBe(200);
    expect(studentService.updateStudentProfile).toHaveBeenCalledWith(
      '68d2c50a8c4e1c843a39a201',
      { fullName: 'Jane Doe' },
    );
  });

  it('allows a student to delete their profile', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a201',
      email: 'student@example.test',
      role: 'student',
    });

    const response = await request(app)
      .delete('/api/v1/students/me')
      .set('Authorization', 'Bearer student-token');

    expect(response.status).toBe(204);
    expect(studentService.deleteStudentProfile).toHaveBeenCalledWith('68d2c50a8c4e1c843a39a201');
  });

  it('denies non-student roles from accessing student profile endpoints', async () => {
    authenticate.mockResolvedValue({
      id: '68d2c50a8c4e1c843a39a202',
      email: 'hr@example.test',
      role: 'organization_representative',
    });

    const response = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', 'Bearer org-token');

    expect(response.status).toBe(403);
    expect(studentService.getStudentProfile).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/v1/students/me');

    expect(response.status).toBe(401);
    expect(studentService.getStudentProfile).not.toHaveBeenCalled();
  });
});

describe('student profile validation', () => {
  it('accepts valid profile data', () => {
    expect(studentProfileCreateSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects invalid profile data', () => {
    expect(studentProfileCreateSchema.safeParse({ ...validProfile, fullName: '' }).success).toBe(false);
    expect(studentProfileCreateSchema.safeParse({ ...validProfile, expectedDurationWeeks: 0 }).success).toBe(false);
    expect(studentProfileCreateSchema.safeParse({ ...validProfile, preferredLocations: 'not-an-array' }).success).toBe(false);
  });

  it('rejects empty update', () => {
    expect(studentProfileUpdateSchema.safeParse({}).success).toBe(false);
  });
});
