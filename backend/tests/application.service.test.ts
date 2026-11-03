import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  studentModel,
  opportunityModel,
  organizationModel,
  applicationModel,
  assertStudentVerificationDocuments,
  applicationStatuses,
} = vi.hoisted(() => ({
  studentModel: { findOne: vi.fn() },
  opportunityModel: { findById: vi.fn() },
  organizationModel: { findById: vi.fn() },
  applicationModel: { findOne: vi.fn() },
  assertStudentVerificationDocuments: vi.fn(),
  applicationStatuses: [
    'submitted',
    'under_review',
    'shortlisted',
    'interview',
    'offer',
    'accepted',
    'rejected',
    'withdrawn',
  ],
}));

vi.mock('../src/modules/identity/models/student.model.js', () => ({ Student: studentModel }));
vi.mock('../src/modules/opportunities/models/opportunity.model.js', () => ({
  Opportunity: opportunityModel,
}));
vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: organizationModel,
}));
vi.mock('../src/modules/applications/models/application.model.js', () => ({
  Application: applicationModel,
  applicationStatuses,
}));
vi.mock('../src/modules/documents/services/document.service.js', () => ({
  assertStudentVerificationDocuments,
}));

import { createApplication } from '../src/modules/applications/services/application.service.js';

const studentId = new Types.ObjectId();
const opportunityId = new Types.ObjectId();

function leanResult(value: unknown) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

describe('application submission availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentModel.findOne.mockReturnValue(leanResult({ _id: new Types.ObjectId() }));
    assertStudentVerificationDocuments.mockResolvedValue(undefined);
    applicationModel.findOne.mockReturnValue(leanResult(null));
    organizationModel.findById.mockReturnValue(leanResult({ verificationStatus: 'verified' }));
  });

  it('rejects applications to closed opportunities', async () => {
    opportunityModel.findById.mockReturnValue(
      leanResult({
        status: 'closed',
        applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        availableSlots: 1,
      }),
    );

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPPORTUNITY_NOT_APPLICABLE' });

    expect(organizationModel.findById).not.toHaveBeenCalled();
  });

  it('rejects applications after the deadline', async () => {
    opportunityModel.findById.mockReturnValue(
      leanResult({
        status: 'published',
        applicationDeadline: new Date(Date.now() - 1),
        availableSlots: 1,
      }),
    );

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).rejects.toMatchObject({ statusCode: 400, code: 'APPLICATION_DEADLINE_PASSED' });
  });
});
