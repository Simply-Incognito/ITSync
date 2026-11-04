import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import type { AppError } from '../src/errors/app-error.js';

const mocks = vi.hoisted(() => ({
  findApplication: vi.fn(),
  findOrganization: vi.fn(),
  findOwnedOpportunity: vi.fn(),
  createReviewEvent: vi.fn(),
}));

vi.mock('../src/modules/identity/models/user.model.js', () => ({ User: {} }));
vi.mock('../src/modules/identity/models/student.model.js', () => ({ Student: {} }));
vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: { findOne: mocks.findOrganization },
}));
vi.mock('../src/modules/opportunities/models/opportunity.model.js', () => ({
  Opportunity: { exists: mocks.findOwnedOpportunity },
}));
vi.mock('../src/modules/applications/models/application.model.js', () => ({
  Application: { findById: mocks.findApplication },
}));
vi.mock('../src/modules/applications/models/application-review-event.model.js', () => ({
  ApplicationReviewEvent: { create: mocks.createReviewEvent },
}));
vi.mock('../src/modules/documents/services/document.service.js', () => ({
  assertStudentVerificationDocuments: vi.fn(),
}));

import { updateApplicationStatus } from '../src/modules/applications/services/application.service.js';

describe('updateApplicationStatus', () => {
  const applicationId = new Types.ObjectId();
  const opportunityId = new Types.ObjectId();
  const organizationId = new Types.ObjectId();
  const application = {
    _id: applicationId,
    opportunityId,
    status: 'submitted',
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    application.status = 'submitted';
    application.save.mockResolvedValue(application);
    mocks.findApplication.mockResolvedValue(application);
    mocks.findOrganization.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ _id: organizationId }),
    });
    mocks.findOwnedOpportunity.mockResolvedValue({ _id: opportunityId });
    mocks.createReviewEvent.mockResolvedValue({});
  });

  it('rejects reviews from organizations that do not own the opportunity', async () => {
    mocks.findOwnedOpportunity.mockResolvedValue(null);

    await expect(
      updateApplicationStatus(applicationId, 'under_review', 'representative-id'),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'APPLICATION_REVIEW_FORBIDDEN',
    } satisfies Partial<AppError>);

    expect(application.save).not.toHaveBeenCalled();
    expect(mocks.createReviewEvent).not.toHaveBeenCalled();
  });

  it('updates application status for the organization that owns the opportunity', async () => {
    await expect(
      updateApplicationStatus(applicationId, 'under_review', 'representative-id'),
    ).resolves.toBe(application);

    expect(mocks.findOwnedOpportunity).toHaveBeenCalledWith({
      _id: opportunityId,
      organizationId,
    });
    expect(application.status).toBe('under_review');
    expect(application.save).toHaveBeenCalledOnce();
    expect(mocks.createReviewEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId,
        actorUserId: 'representative-id',
        fromStatus: 'submitted',
        toStatus: 'under_review',
      }),
    );
  });
});
