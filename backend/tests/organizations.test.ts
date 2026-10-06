import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: { findOne: vi.fn() },
  organizationStatuses: ['draft', 'pending', 'verified', 'rejected', 'suspended'],
}));

import type { AppError } from '../src/errors/app-error.js';
import { Organization } from '../src/modules/organizations/models/organization.model.js';
import { requireVerifiedOrganization } from '../src/modules/organizations/middleware/require-verified-organization.js';
import { organizationProfileUpdateSchema } from '../src/modules/organizations/validations/organization.validation.js';

const representativeRequest = {
  identity: {
    id: '68d2c50a8c4e1c843a39a201',
    email: 'hr@example.test',
    role: 'organization_representative',
  },
} as Request;

describe('verified organization middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks the current verified status and exposes the organization ID', async () => {
    const select = vi.fn().mockResolvedValue({ _id: '68d2c50a8c4e1c843a39a202' });
    vi.mocked(Organization.findOne).mockReturnValue({ select } as never);
    const nextCalls: unknown[] = [];
    const next = ((error?: unknown) => nextCalls.push(error)) as NextFunction;

    await requireVerifiedOrganization(representativeRequest, {} as Response, next);

    expect(Organization.findOne).toHaveBeenCalledWith({
      representativeUserId: representativeRequest.identity?.id,
      verificationStatus: 'verified',
    });
    expect(representativeRequest.organizationId).toBe('68d2c50a8c4e1c843a39a202');
    expect(nextCalls).toEqual([undefined]);
  });

  it('denies a pending, rejected, or suspended organization', async () => {
    const select = vi.fn().mockResolvedValue(null);
    vi.mocked(Organization.findOne).mockReturnValue({ select } as never);
    const nextCalls: unknown[] = [];
    const next = ((error?: unknown) => nextCalls.push(error)) as NextFunction;

    await requireVerifiedOrganization(representativeRequest, {} as Response, next);

    const error = nextCalls[0] as AppError;
    expect(error).toMatchObject({ statusCode: 403, code: 'ORGANIZATION_NOT_VERIFIED' });
  });

  it('denies other account roles without querying organization data', async () => {
    const nextCalls: unknown[] = [];
    const next = ((error?: unknown) => nextCalls.push(error)) as NextFunction;
    const request = {
      identity: { ...representativeRequest.identity, role: 'student' },
    } as Request;

    await requireVerifiedOrganization(request, {} as Response, next);

    expect(Organization.findOne).not.toHaveBeenCalled();
    expect(nextCalls[0]).toMatchObject({ statusCode: 403, code: 'ROLE_FORBIDDEN' });
  });
});

describe('organization profile update validation', () => {
  it('accepts non-empty profile fields and rejects empty or privileged fields', () => {
    expect(
      organizationProfileUpdateSchema.safeParse({ description: 'Updated organization summary.' })
        .success,
    ).toBe(true);
    expect(organizationProfileUpdateSchema.safeParse({}).success).toBe(false);
    expect(
      organizationProfileUpdateSchema.safeParse({ verificationStatus: 'verified' }).success,
    ).toBe(false);
  });
});
