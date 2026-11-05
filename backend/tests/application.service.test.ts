import mongoose, { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mocks, applicationModel } = vi.hoisted(() => {
  const mocks = {
    studentFindOne: vi.fn(),
    userFindById: vi.fn(),
    opportunityFindById: vi.fn(),
    opportunityExists: vi.fn(),
    opportunityUpdateOne: vi.fn(),
    organizationFindById: vi.fn(),
    organizationFindOne: vi.fn(),
    applicationFindOne: vi.fn(),
    applicationFindById: vi.fn(),
    applicationConstruct: vi.fn(),
    applicationReviewCreate: vi.fn(),
    assertStudentDocuments: vi.fn(),
  };
  const applicationModel = Object.assign(
    vi.fn(function (this: Record<string, unknown>, fields: Record<string, unknown>) {
      mocks.applicationConstruct(fields);
      Object.assign(this, fields);
      this.save = vi.fn().mockResolvedValue(this);
    }),
    {
      findOne: mocks.applicationFindOne,
      findById: mocks.applicationFindById,
      countDocuments: vi.fn(),
      find: vi.fn(),
    },
  );
  return { mocks, applicationModel };
});

vi.mock('../src/modules/identity/models/student.model.js', () => ({
  Student: { findOne: mocks.studentFindOne, find: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../src/modules/identity/models/user.model.js', () => ({
  User: { findById: mocks.userFindById },
}));
vi.mock('../src/modules/opportunities/models/opportunity.model.js', () => ({
  Opportunity: {
    findById: mocks.opportunityFindById,
    exists: mocks.opportunityExists,
    updateOne: mocks.opportunityUpdateOne,
  },
}));
vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: { findById: mocks.organizationFindById, findOne: mocks.organizationFindOne },
}));
vi.mock('../src/modules/applications/models/application.model.js', () => ({
  Application: applicationModel,
}));
vi.mock('../src/modules/applications/models/application-review-event.model.js', () => ({
  ApplicationReviewEvent: { create: mocks.applicationReviewCreate },
}));
vi.mock('../src/modules/documents/services/document.service.js', () => ({
  assertStudentVerificationDocuments: mocks.assertStudentDocuments,
}));

import {
  createApplication,
  updateApplicationStatus,
} from '../src/modules/applications/services/application.service.js';

const studentId = new Types.ObjectId();
const opportunityId = new Types.ObjectId();
const applicationId = new Types.ObjectId();
const organizationId = new Types.ObjectId();
const session = {
  withTransaction: vi.fn(async (operation: () => Promise<void>) => operation()),
  endSession: vi.fn(),
};

function leanResult(value: unknown) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

describe('application service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    mocks.studentFindOne.mockReturnValue(
      leanResult({ _id: new Types.ObjectId(), userId: studentId }),
    );
    mocks.assertStudentDocuments.mockResolvedValue(undefined);
    mocks.organizationFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    mocks.applicationFindOne.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult(null)),
    });
    mocks.applicationReviewCreate.mockResolvedValue([]);
    mocks.opportunityUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('rejects applications to closed opportunities', async () => {
    mocks.opportunityFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(
        leanResult({
          status: 'closed',
          applicationDeadline: new Date(Date.now() + 86_400_000),
          availableSlots: 1,
        }),
      ),
    });

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPPORTUNITY_NOT_APPLICABLE' });

    expect(mocks.organizationFindById).not.toHaveBeenCalled();
  });

  it('rejects applications after the deadline', async () => {
    mocks.opportunityFindById.mockReturnValue({
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
      applicationDeadline: new Date(Date.now() + 86_400_000),
      availableSlots: 3,
    };
    mocks.opportunityFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult(opportunity)),
    });
    mocks.organizationFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    applicationModel.mockImplementation(() => savedApplication as never);

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).resolves.toBe(savedApplication);

    expect(mocks.opportunityUpdateOne).not.toHaveBeenCalled();
    expect(savedApplication.save).toHaveBeenCalledWith({ session });
    expect(mocks.applicationReviewCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ studentId, action: 'submitted' })],
      { session },
    );
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('allows applications when the posted slot count is zero', async () => {
    const savedApplication = { save: vi.fn().mockResolvedValue(undefined) };
    mocks.opportunityFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(
        leanResult({
          _id: opportunityId,
          organizationId: new Types.ObjectId(),
          status: 'published',
          applicationDeadline: new Date(Date.now() + 86_400_000),
          availableSlots: 0,
        }),
      ),
    });
    mocks.organizationFindById.mockReturnValue({
      session: vi.fn().mockReturnValue(leanResult({ verificationStatus: 'verified' })),
    });
    applicationModel.mockImplementation(() => savedApplication as never);

    await expect(
      createApplication({ studentId, opportunityId, studentDocumentIds: [] }, String(studentId)),
    ).resolves.toBe(savedApplication);

    expect(mocks.opportunityUpdateOne).not.toHaveBeenCalled();
  });

  it('prevents a representative from reviewing another organization’s application', async () => {
    const application = {
      _id: applicationId,
      opportunityId,
      status: 'submitted',
      save: vi.fn(),
    };
    mocks.applicationFindById.mockResolvedValue(application);
    mocks.organizationFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult({ _id: organizationId })),
    });
    mocks.opportunityExists.mockResolvedValue(null);

    await expect(
      updateApplicationStatus(applicationId, 'under_review', String(studentId)),
    ).rejects.toMatchObject({ statusCode: 403, code: 'APPLICATION_REVIEW_FORBIDDEN' });

    expect(application.save).not.toHaveBeenCalled();
    expect(mocks.applicationReviewCreate).not.toHaveBeenCalled();
  });

  it('allows only the owning organization to review its application', async () => {
    const application = {
      _id: applicationId,
      opportunityId,
      status: 'submitted',
      save: vi.fn().mockResolvedValue(undefined),
    };
    mocks.applicationFindById.mockResolvedValue(application);
    mocks.organizationFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult({ _id: organizationId })),
    });
    mocks.opportunityExists.mockResolvedValue({ _id: opportunityId });

    await expect(
      updateApplicationStatus(applicationId, 'under_review', String(studentId)),
    ).resolves.toBe(application);

    expect(mocks.opportunityExists).toHaveBeenCalledWith({
      _id: opportunityId,
      organizationId,
    });
    expect(application.save).toHaveBeenCalledOnce();
    expect(mocks.applicationReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'submitted', toStatus: 'under_review' }),
    );
  });
});
