import mongoose, { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  studentModel,
  opportunityModel,
  organizationModel,
  applicationModel,
  applicationReviewEventModel,
  assertStudentVerificationDocuments,
  applicationStatuses,
} = vi.hoisted(() => ({
  studentModel: { findOne: vi.fn() },
  opportunityModel: { findById: vi.fn(), updateOne: vi.fn() },
  organizationModel: { findById: vi.fn() },
  applicationModel: Object.assign(vi.fn(), { findOne: vi.fn() }),
  applicationReviewEventModel: { create: vi.fn() },
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
vi.mock('../src/modules/applications/models/application-review-event.model.js', () => ({
  ApplicationReviewEvent: applicationReviewEventModel,
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
  const session = {
    withTransaction: vi.fn(async (operation: () => Promise<void>) => operation()),
    endSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    studentModel.findOne.mockReturnValue(leanResult({ _id: new Types.ObjectId(), userId: studentId }));
    assertStudentVerificationDocuments.mockResolvedValue(undefined);
    organizationModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    applicationModel.findOne.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult(null)),
    });
    applicationReviewEventModel.create.mockResolvedValue([]);
    opportunityModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('rejects applications to closed opportunities', async () => {
    opportunityModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(
        leanResult({
          status: 'closed',
          applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableSlots: 1,
        }),
      ),
    });

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPPORTUNITY_NOT_APPLICABLE' });

    expect(organizationModel.findById).not.toHaveBeenCalled();
  });

  it('rejects applications after the deadline', async () => {
    opportunityModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(
        leanResult({
          status: 'published',
          applicationDeadline: new Date(Date.now() - 1),
          availableSlots: 1,
        }),
      ),
    });

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).rejects.toMatchObject({ statusCode: 400, code: 'APPLICATION_DEADLINE_PASSED' });
  });

  it('creates an application without changing the opportunity slot count', async () => {
    const savedApplication = { save: vi.fn().mockResolvedValue(undefined) };
    const opportunity = {
      _id: opportunityId,
      organizationId: new Types.ObjectId(),
      status: 'published',
      applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      availableSlots: 3,
    };
    opportunityModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult(opportunity)),
    });
    organizationModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    applicationModel.mockImplementation(() => savedApplication);

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).resolves.toBe(savedApplication);

    expect(opportunityModel.updateOne).not.toHaveBeenCalled();
    expect(savedApplication.save).toHaveBeenCalledWith({ session });
    expect(applicationReviewEventModel.create).toHaveBeenCalledWith(
      [expect.objectContaining({ studentId, action: 'submitted' })],
      { session },
    );
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('allows applications when the posted slot count is zero', async () => {
    const savedApplication = { save: vi.fn().mockResolvedValue(undefined) };
    opportunityModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(
        leanResult({
          _id: opportunityId,
          organizationId: new Types.ObjectId(),
          status: 'published',
          applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableSlots: 0,
        }),
      ),
    });
    organizationModel.findById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    applicationModel.mockImplementation(() => savedApplication);

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).resolves.toBe(savedApplication);

    expect(opportunityModel.updateOne).not.toHaveBeenCalled();
    expect(savedApplication.save).toHaveBeenCalledWith({ session });
  });
});
