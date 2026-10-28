import mongoose, { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { Organization } from '../../organizations/models/organization.model.js';
import { Opportunity, type OpportunityStatus } from '../models/opportunity.model.js';
import { OpportunityReviewEvent } from '../models/opportunity-review-event.model.js';
import type {
  OpportunityInput,
  OpportunityUpdateInput,
} from '../validations/opportunity.validation.js';

function notFound() {
  return new AppError('Opportunity was not found.', 404, 'OPPORTUNITY_NOT_FOUND');
}

function parseId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw notFound();
  return new Types.ObjectId(id);
}

async function withTransaction<T>(operation: (session: mongoose.ClientSession) => Promise<T>) {
  const session = await mongoose.startSession();
  let result!: T;
  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function findOwnedOpportunity(opportunityId: string, organizationId: string) {
  const opportunity = await Opportunity.findOne({
    _id: parseId(opportunityId),
    organizationId: parseId(organizationId),
  });
  if (!opportunity) throw notFound();
  return opportunity;
}

export async function createOpportunity(
  organizationId: string,
  actorUserId: string,
  input: OpportunityInput,
) {
  return withTransaction(async (session) => {
    const opportunity = new Opportunity({
      ...input,
      organizationId: parseId(organizationId),
      createdBy: parseId(actorUserId),
      status: 'draft',
    });
    await opportunity.save({ session });
    await OpportunityReviewEvent.create(
      [
        {
          opportunityId: opportunity._id,
          organizationId: opportunity.organizationId,
          actorUserId: parseId(actorUserId),
          toStatus: 'draft',
          note: 'Opportunity created.',
        },
      ],
      { session },
    );
    return opportunity;
  });
}

export async function listMyOpportunities(organizationId: string) {
  return Opportunity.find({ organizationId: parseId(organizationId) })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
}

export async function getMyOpportunity(opportunityId: string, organizationId: string) {
  return findOwnedOpportunity(opportunityId, organizationId);
}

export async function updateMyOpportunity(
  opportunityId: string,
  organizationId: string,
  input: OpportunityUpdateInput,
) {
  const opportunity = await findOwnedOpportunity(opportunityId, organizationId);
  if (!['draft', 'rejected'].includes(opportunity.status)) {
    throw new AppError(
      'Only draft or rejected opportunities can be edited.',
      409,
      'OPPORTUNITY_NOT_EDITABLE',
    );
  }
  opportunity.set(input);
  await opportunity.save();
  return opportunity;
}

export async function submitMyOpportunity(
  opportunityId: string,
  organizationId: string,
  actorUserId: string,
) {
  const id = parseId(opportunityId);
  return withTransaction(async (session) => {
    const opportunity = await Opportunity.findOne({
      _id: id,
      organizationId: parseId(organizationId),
    }).session(session);
    if (!opportunity) throw notFound();
    if (!['draft', 'rejected'].includes(opportunity.status)) {
      throw new AppError(
        'Only draft or rejected opportunities can be submitted for review.',
        409,
        'INVALID_OPPORTUNITY_STATE',
      );
    }
    if (opportunity.applicationDeadline <= new Date()) {
      throw new AppError(
        'The application deadline must be in the future.',
        400,
        'INVALID_APPLICATION_DEADLINE',
      );
    }

    const fromStatus = opportunity.status;
    opportunity.status = 'pending_review';
    opportunity.reviewNote = null;
    await opportunity.save({ session });
    await OpportunityReviewEvent.create(
      [
        {
          opportunityId: opportunity._id,
          organizationId: opportunity.organizationId,
          actorUserId: parseId(actorUserId),
          action: 'submitted',
          fromStatus,
          toStatus: 'pending_review',
        },
      ],
      { session },
    );
    return opportunity;
  });
}

export async function closeMyOpportunity(
  opportunityId: string,
  organizationId: string,
  actorUserId: string,
) {
  const id = parseId(opportunityId);
  return withTransaction(async (session) => {
    const opportunity = await Opportunity.findOne({
      _id: id,
      organizationId: parseId(organizationId),
    }).session(session);
    if (!opportunity) throw notFound();
    if (opportunity.status !== 'published') {
      throw new AppError(
        'Only published opportunities can be closed.',
        409,
        'INVALID_OPPORTUNITY_STATE',
      );
    }

    opportunity.status = 'closed';
    await opportunity.save({ session });
    await OpportunityReviewEvent.create(
      [
        {
          opportunityId: opportunity._id,
          organizationId: opportunity.organizationId,
          actorUserId: parseId(actorUserId),
          action: 'closed',
          fromStatus: 'published',
          toStatus: 'closed',
        },
      ],
      { session },
    );
    return opportunity;
  });
}

export async function listPublishedOpportunities() {
  const verifiedOrganizationIds = await Organization.distinct('_id', {
    verificationStatus: 'verified',
  });
  return Opportunity.find({
    organizationId: { $in: verifiedOrganizationIds },
    status: 'published',
    applicationDeadline: { $gt: new Date() },
  })
    .sort({ publishedAt: -1 })
    .limit(100)
    .populate('organizationId', 'legalName tradingName industry address website')
    .lean();
}

export async function getPublishedOpportunity(opportunityId: string) {
  const opportunity = await Opportunity.findOne({
    _id: parseId(opportunityId),
    status: 'published',
    applicationDeadline: { $gt: new Date() },
  }).lean();
  if (!opportunity) throw notFound();
  const organization = await Organization.findOne({
    _id: opportunity.organizationId,
    verificationStatus: 'verified',
  })
    .select('legalName tradingName industry address website')
    .lean();
  if (!organization) throw notFound();
  return { ...opportunity, organizationId: organization };
}

export async function listOpportunitiesForReview(status?: OpportunityStatus) {
  const filter = status ? { status } : { status: 'pending_review' };
  return Opportunity.find(filter).sort({ createdAt: 1 }).limit(100).lean();
}

export async function getOpportunityReview(opportunityId: string) {
  const id = parseId(opportunityId);
  const opportunity = await Opportunity.findById(id).lean();
  if (!opportunity) throw notFound();
  const events = await OpportunityReviewEvent.find({ opportunityId: id })
    .sort({ createdAt: -1 })
    .lean();
  return { opportunity, events };
}

async function transitionOpportunity(
  opportunityId: string,
  actorUserId: string,
  expectedStatuses: OpportunityStatus[],
  toStatus: OpportunityStatus,
  action: 'approved' | 'rejected' | 'suspended',
  note: string,
) {
  const id = parseId(opportunityId);
  return withTransaction(async (session) => {
    const opportunity = await Opportunity.findById(id).session(session);
    if (!opportunity) throw notFound();
    if (!expectedStatuses.includes(opportunity.status)) {
      throw new AppError(
        'The opportunity status changed or is not eligible for this action.',
        409,
        'INVALID_OPPORTUNITY_STATE',
      );
    }
    if (toStatus === 'published') {
      if (opportunity.applicationDeadline <= new Date()) {
        throw new AppError(
          'An opportunity cannot be published after its application deadline.',
          409,
          'INVALID_APPLICATION_DEADLINE',
        );
      }
      const verifiedOrganization = await Organization.findOne({
        _id: opportunity.organizationId,
        verificationStatus: 'verified',
      }).session(session);
      if (!verifiedOrganization) {
        throw new AppError(
          'The organization must remain verified before its opportunity can be published.',
          409,
          'ORGANIZATION_NOT_VERIFIED',
        );
      }
    }

    const fromStatus = opportunity.status;
    opportunity.status = toStatus;
    opportunity.reviewNote = note;
    if (toStatus === 'published') opportunity.publishedAt = new Date();
    await opportunity.save({ session });
    await OpportunityReviewEvent.create(
      [
        {
          opportunityId: opportunity._id,
          organizationId: opportunity.organizationId,
          actorUserId: parseId(actorUserId),
          action,
          fromStatus,
          toStatus,
          note,
        },
      ],
      { session },
    );
    return opportunity;
  });
}

export function approveOpportunity(opportunityId: string, actorUserId: string, note = '') {
  return transitionOpportunity(
    opportunityId,
    actorUserId,
    ['pending_review'],
    'published',
    'approved',
    note,
  );
}

export function rejectOpportunity(opportunityId: string, actorUserId: string, reason: string) {
  return transitionOpportunity(
    opportunityId,
    actorUserId,
    ['pending_review'],
    'rejected',
    'rejected',
    reason,
  );
}

export function suspendOpportunity(opportunityId: string, actorUserId: string, reason: string) {
  return transitionOpportunity(
    opportunityId,
    actorUserId,
    ['published'],
    'suspended',
    'suspended',
    reason,
  );
}
