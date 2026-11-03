import mongoose, { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  studentModel,
  userModel,
  opportunityModel,
  organizationModel,
  applicationModel,
  applicationReviewEventModel,
  assertStudentVerificationDocuments,
  applicationStatuses,
} = vi.hoisted(() => ({
  studentModel: { findOne: vi.fn() },
  userModel: { findById: vi.fn() },
  opportunityModel: { findById: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() },
  organizationModel: { findById: vi.fn(), findOne: vi.fn() },
  applicationModel: Object.assign(vi.fn(), { findOne: vi.fn(), findById: vi.fn() }),
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
vi.mock('../src/modules/identity/models/user.model.js', () => ({ User: userModel }));
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

import {
  createApplication,
  updateApplicationStatus,
} from '../src/modules/applications/services/application.service.js';

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

describe('organization application review authorization', () => {
  const organizationId = new Types.ObjectId();
  const applicationId = new Types.ObjectId();
  const representativeId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not allow a representative to review an application for another organization', async () => {
    const application = {
      _id: applicationId,
      opportunityId,
      status: 'submitted',
      save: vi.fn(),
    };
    applicationModel.findById.mockResolvedValue(application);
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult({ role: 'organization_representative' })),
    });
    organizationModel.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult({ _id: organizationId })),
    });
    opportunityModel.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult(null)),
    });

    await expect(
      updateApplicationStatus(applicationId, 'accepted', String(representativeId)),
    ).rejects.toMatchObject({ statusCode: 404, code: 'APPLICATION_NOT_FOUND' });

    expect(application.save).not.toHaveBeenCalled();
    expect(applicationReviewEventModel.create).not.toHaveBeenCalled();
  });

  it('does not allow a system administrator to accept a student application', async () => {
    const application = {
      _id: applicationId,
      opportunityId,
      status: 'offer',
      save: vi.fn(),
    };
    applicationModel.findById.mockResolvedValue(application);
    userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue(leanResult({ role: 'administrator' })),
    });

    await expect(
      updateApplicationStatus(applicationId, 'accepted', String(representativeId)),
    ).rejects.toMatchObject({ statusCode: 403, code: 'ROLE_FORBIDDEN' });

    expect(application.save).not.toHaveBeenCalled();
    expect(applicationReviewEventModel.create).not.toHaveBeenCalled();
  });
});
