import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { opportunityModel, reviewEventModel, organizationModel } = vi.hoisted(() => ({
    opportunityModel: Object.assign(vi.fn(), { findById: vi.fn() }),
    reviewEventModel: { create: vi.fn() },
    organizationModel: { findOne: vi.fn() },
}));

vi.mock('../src/modules/opportunities/models/opportunity.model.js', () => ({
    Opportunity: opportunityModel,
}));
vi.mock('../src/modules/opportunities/models/opportunity-review-event.model.js', () => ({
    OpportunityReviewEvent: reviewEventModel,
}));
vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
    Organization: organizationModel,
}));

import {
    approveOpportunity,
    createOpportunity,
} from '../src/modules/opportunities/services/opportunity.service.js';

const opportunityId = '68d2c50a8c4e1c843a39a205';
const organizationId = '68d2c50a8c4e1c843a39a202';
const administratorId = '68d2c50a8c4e1c843a39a204';

describe('opportunity moderation service', () => {
    const session = {
        withTransaction: vi.fn(async (operation: () => Promise<void>) => operation()),
        endSession: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
        reviewEventModel.create.mockResolvedValue([]);
    });

    describe('opportunity creation service', () => {
        const session = {
            withTransaction: vi.fn(async (operation: () => Promise<void>) => operation()),
            endSession: vi.fn(),
        };

        beforeEach(() => {
            vi.clearAllMocks();
            vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
            reviewEventModel.create.mockResolvedValue([]);
        });

        it('creates a draft and records its creation event in the same transaction', async () => {
            const opportunity = {
                _id: new mongoose.Types.ObjectId(),
                organizationId: new mongoose.Types.ObjectId(organizationId),
                save: vi.fn().mockResolvedValue(undefined),
            };
            opportunityModel.mockImplementation(() => opportunity);

            const input = {
                title: 'Software Engineering SIWES Placement',
                description: 'Work with the product engineering team on supervised software projects.',
                fieldOfStudy: 'Computer Science',
                requiredSkills: [],
                academicRequirements: '',
                location: { city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
                workArrangement: 'hybrid' as const,
                durationWeeks: 24,
                availableSlots: 4,
                applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
                requiredDocuments: [],
                additionalRequirements: '',
            };

            const result = await createOpportunity(organizationId, administratorId, input);

            expect(result).toBe(opportunity);
            expect(opportunity.save).toHaveBeenCalledWith({ session });
            const [events, options] = reviewEventModel.create.mock.calls[0] as [
                Record<string, unknown>[],
                { session: typeof session },
            ];
            expect(events[0]).toMatchObject({
                opportunityId: opportunity._id,
                organizationId: opportunity.organizationId,
                actorUserId: new mongoose.Types.ObjectId(administratorId),
                action: 'created',
                toStatus: 'draft',
                note: 'Opportunity created.',
            });
            expect(options).toEqual({ session });
            expect(session.endSession).toHaveBeenCalledOnce();
        });
    });

    it('publishes a pending opportunity and writes its audit event in the same transaction', async () => {
        const opportunity = {
            _id: opportunityId,
            organizationId,
            status: 'pending_review',
            applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            publishedAt: null,
            reviewNote: null,
            save: vi.fn().mockResolvedValue(undefined),
        };
        const organizationQuery = { session: vi.fn().mockResolvedValue({ _id: organizationId }) };
        const opportunityQuery = { session: vi.fn().mockResolvedValue(opportunity) };
        opportunityModel.findById.mockReturnValue(opportunityQuery);
        organizationModel.findOne.mockReturnValue(organizationQuery);

        const result = await approveOpportunity(opportunityId, administratorId, 'Reviewed.');

        expect(result).toBe(opportunity);
        expect(opportunity.status).toBe('published');
        expect(opportunity.publishedAt).toBeInstanceOf(Date);
        expect(opportunity.save).toHaveBeenCalledWith({ session });
        expect(organizationQuery.session).toHaveBeenCalledWith(session);
        const [events, options] = reviewEventModel.create.mock.calls[0] as [
            Record<string, unknown>[],
            { session: typeof session },
        ];
        expect(events[0]).toMatchObject({
            opportunityId,
            organizationId,
            actorUserId: new mongoose.Types.ObjectId(administratorId),
            action: 'approved',
            fromStatus: 'pending_review',
            toStatus: 'published',
            note: 'Reviewed.',
        });
        expect(options).toEqual({ session });
        expect(session.endSession).toHaveBeenCalledOnce();
    });

    it('refuses publication if the organization is no longer verified', async () => {
        const opportunity = {
            _id: opportunityId,
            organizationId,
            status: 'pending_review',
            applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            save: vi.fn(),
        };
        opportunityModel.findById.mockReturnValue({
            session: vi.fn().mockResolvedValue(opportunity),
        });
        organizationModel.findOne.mockReturnValue({ session: vi.fn().mockResolvedValue(null) });

        await expect(approveOpportunity(opportunityId, administratorId)).rejects.toMatchObject({
            statusCode: 409,
            code: 'ORGANIZATION_NOT_VERIFIED',
        });

        expect(opportunity.save).not.toHaveBeenCalled();
        expect(reviewEventModel.create).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalledOnce();
    });

    it('does not change a non-pending opportunity', async () => {
        const opportunity = {
            _id: opportunityId,
            organizationId,
            status: 'rejected',
            save: vi.fn(),
        };
        opportunityModel.findById.mockReturnValue({
            session: vi.fn().mockResolvedValue(opportunity),
        });

        await expect(approveOpportunity(opportunityId, administratorId)).rejects.toMatchObject({
            statusCode: 409,
            code: 'INVALID_OPPORTUNITY_STATE',
        });

        expect(organizationModel.findOne).not.toHaveBeenCalled();
        expect(opportunity.save).not.toHaveBeenCalled();
        expect(reviewEventModel.create).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalledOnce();
    });
});