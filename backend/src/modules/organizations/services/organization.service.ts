import mongoose, { Types } from 'mongoose';
import { AppError } from '../../../errors/app-error.js';
import { Organization, type OrganizationStatus } from '../models/organization.model.js';
import { OrganizationDocument } from '../models/organization-document.model.js';
import { OrganizationReviewEvent } from '../models/organization-review-event.model.js';
import {
  deleteOrganizationDocument,
  storeOrganizationDocument,
} from '../utils/document-storage.js';
import type {
  OrganizationProfileInput,
  OrganizationProfileUpdateInput,
  OrganizationReviewInput,
} from '../validations/organization.validation.js';

const requiredDocumentTypes = [
  'cac_certificate',
  'representative_authorization',
  'proof_of_address',
] as const;

function notFound() {
  return new AppError('Organization was not found.', 404, 'ORGANIZATION_NOT_FOUND');
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

async function findRepresentativeOrganization(representativeUserId: string) {
  const organization = await Organization.findOne({ representativeUserId });
  if (!organization) throw notFound();
  return organization;
}

function publicDocument(document: {
  _id: Types.ObjectId;
  documentType: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  createdAt: Date;
}) {
  return {
    id: String(document._id),
    documentType: document.documentType,
    originalName: document.originalName,
    contentType: document.contentType,
    byteSize: document.byteSize,
    uploadedAt: document.createdAt,
  };
}

export async function createOrganizationProfile(
  representativeUserId: string,
  input: OrganizationProfileInput,
) {
  try {
    return await Organization.create({
      ...input,
      representativeUserId,
      verificationStatus: 'draft',
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        'An organization profile or registration number already exists.',
        409,
        'ORGANIZATION_ALREADY_REGISTERED',
      );
    }
    throw error;
  }
}

export async function getMyOrganization(representativeUserId: string) {
  const organization = await findRepresentativeOrganization(representativeUserId);
  const documents = await OrganizationDocument.find({ organizationId: organization._id }).sort({
    createdAt: 1,
  });
  return { organization, documents: documents.map(publicDocument) };
}

export async function updateMyOrganizationProfile(
  representativeUserId: string,
  input: OrganizationProfileUpdateInput,
) {
  const organization = await findRepresentativeOrganization(representativeUserId);
  if (!['draft', 'rejected'].includes(organization.verificationStatus)) {
    throw new AppError(
      'Profile details can only be changed while in draft or rejected status.',
      409,
      'VERIFICATION_NOT_EDITABLE',
    );
  }

  organization.set(input);
  await organization.save();
  return organization;
}

export async function addOrganizationDocument(
  representativeUserId: string,
  documentType: string,
  file: Express.Multer.File,
) {
  const organization = await findRepresentativeOrganization(representativeUserId);
  if (!['draft', 'rejected'].includes(organization.verificationStatus)) {
    throw new AppError(
      'Documents can only be changed while verification is in draft or rejected status.',
      409,
      'VERIFICATION_NOT_EDITABLE',
    );
  }

  const stored = await storeOrganizationDocument(file, {
    organizationId: String(organization._id),
    uploadedBy: representativeUserId,
    documentType,
  });
  try {
    return await OrganizationDocument.create({
      organizationId: organization._id,
      uploadedBy: representativeUserId,
      documentType,
      ...stored,
    });
  } catch (error) {
    await deleteOrganizationDocument(stored.storageId).catch(() => undefined);
    throw error;
  }
}

export async function getOrganizationDocument(organizationId: string, documentId: string) {
  const document = await OrganizationDocument.findOne({
    _id: parseId(documentId),
    organizationId: parseId(organizationId),
  });
  if (!document) throw new AppError('Document was not found.', 404, 'DOCUMENT_NOT_FOUND');
  return document;
}

export async function getMyOrganizationDocument(representativeUserId: string, documentId: string) {
  const organization = await findRepresentativeOrganization(representativeUserId);
  return getOrganizationDocument(String(organization._id), documentId);
}

export async function recordOrganizationDocumentAccess(
  organizationId: string,
  documentId: Types.ObjectId,
  actorUserId: string,
) {
  const organization = await Organization.findById(parseId(organizationId)).select(
    'verificationStatus',
  );
  if (!organization) throw notFound();
  await OrganizationReviewEvent.create({
    organizationId: organization._id,
    actorUserId,
    action: 'document_accessed',
    documentId,
    fromStatus: organization.verificationStatus,
    toStatus: organization.verificationStatus,
  });
}

export async function submitOrganizationForReview(representativeUserId: string) {
  return withTransaction(async (session) => {
    const organization = await Organization.findOne({ representativeUserId }).session(session);
    if (!organization) throw notFound();
    if (!['draft', 'rejected'].includes(organization.verificationStatus)) {
      throw new AppError(
        'This organization cannot be submitted for review.',
        409,
        'INVALID_VERIFICATION_STATE',
      );
    }

    const documents = await OrganizationDocument.find({ organizationId: organization._id })
      .select('documentType')
      .session(session);
    const availableTypes = new Set(documents.map((document) => document.documentType));
    if (requiredDocumentTypes.some((type) => !availableTypes.has(type))) {
      throw new AppError(
        'Upload a CAC certificate, representative authorization, and proof of address before submitting.',
        400,
        'VERIFICATION_DOCUMENTS_INCOMPLETE',
      );
    }

    const previousStatus = organization.verificationStatus;
    organization.verificationStatus = 'pending';
    organization.rejectionReason = null;
    await organization.save({ session });
    await OrganizationReviewEvent.create(
      [
        {
          organizationId: organization._id,
          actorUserId: representativeUserId,
          action: 'submitted',
          fromStatus: previousStatus,
          toStatus: 'pending',
        },
      ],
      { session },
    );
    return organization;
  });
}

export async function listOrganizationsForReview(status?: OrganizationStatus) {
  const filter = status ? { verificationStatus: status } : { verificationStatus: 'pending' };
  return Organization.find(filter).sort({ createdAt: 1 }).limit(100).lean();
}

export async function getOrganizationReview(organizationId: string) {
  const id = parseId(organizationId);
  const organization = await Organization.findById(id).lean();
  if (!organization) throw notFound();
  const [documents, events] = await Promise.all([
    OrganizationDocument.find({ organizationId: id }).sort({ createdAt: 1 }).lean(),
    OrganizationReviewEvent.find({ organizationId: id }).sort({ createdAt: -1 }).lean(),
  ]);
  return { organization, documents: documents.map(publicDocument), events };
}

async function transitionOrganization(
  organizationId: string,
  actorUserId: string,
  expectedStatuses: OrganizationStatus[],
  toStatus: OrganizationStatus,
  action: 'approved' | 'rejected' | 'suspended',
  details: {
    note: string;
    registrySource?: string;
    registryReference?: string;
    verificationChecks?: OrganizationReviewInput['checks'];
  },
) {
  const id = parseId(organizationId);
  return withTransaction(async (session) => {
    const organization = await Organization.findById(id).session(session);
    if (!organization) throw notFound();
    if (!expectedStatuses.includes(organization.verificationStatus)) {
      throw new AppError(
        'The organization status changed or is not eligible for this action.',
        409,
        'INVALID_VERIFICATION_STATE',
      );
    }

    const fromStatus = organization.verificationStatus;
    organization.verificationStatus = toStatus;
    organization.rejectionReason = toStatus === 'rejected' ? details.note : null;
    organization.suspensionReason = toStatus === 'suspended' ? details.note : null;
    if (toStatus === 'verified') {
      organization.verifiedAt = new Date();
      organization.verifiedBy = new Types.ObjectId(actorUserId);
    }
    await organization.save({ session });
    await OrganizationReviewEvent.create(
      [
        {
          organizationId: organization._id,
          actorUserId,
          action,
          fromStatus,
          toStatus,
          note: details.note,
          registrySource: details.registrySource,
          registryReference: details.registryReference,
          verificationChecks: details.verificationChecks,
        },
      ],
      { session },
    );
    return organization;
  });
}

export function approveOrganization(
  organizationId: string,
  actorUserId: string,
  input: OrganizationReviewInput,
) {
  return transitionOrganization(organizationId, actorUserId, ['pending'], 'verified', 'approved', {
    note: input.note ?? 'Verification checks completed.',
    registrySource: input.registrySource,
    registryReference: input.registryReference,
    verificationChecks: input.checks,
  });
}

export function rejectOrganization(organizationId: string, actorUserId: string, reason: string) {
  return transitionOrganization(organizationId, actorUserId, ['pending'], 'rejected', 'rejected', {
    note: reason,
  });
}

export function suspendOrganization(organizationId: string, actorUserId: string, reason: string) {
  return transitionOrganization(
    organizationId,
    actorUserId,
    ['pending', 'verified'],
    'suspended',
    'suspended',
    { note: reason },
  );
}
