import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/organizations/models/organization.model.js', () => ({
  Organization: { findOne: vi.fn() },
  organizationStatuses: ['draft', 'pending', 'verified', 'rejected', 'suspended'],
}));

vi.mock('../src/modules/organizations/models/organization-document.model.js', () => ({
  OrganizationDocument: { findOne: vi.fn(), deleteOne: vi.fn() },
  organizationDocumentTypes: [
    'cac_certificate',
    'cac_status_report',
    'representative_authorization',
    'proof_of_address',
    'other',
  ],
}));

vi.mock('../src/modules/organizations/utils/document-storage.js', () => ({
  deleteOrganizationDocument: vi.fn(),
  openOrganizationDocument: vi.fn(),
  storeOrganizationDocument: vi.fn(),
  maxOrganizationDocumentBytes: 5 * 1024 * 1024,
}));

import { deleteDocument } from '../src/modules/documents/services/document.service.js';
import { Organization } from '../src/modules/organizations/models/organization.model.js';
import { OrganizationDocument } from '../src/modules/organizations/models/organization-document.model.js';
import { deleteOrganizationDocument } from '../src/modules/organizations/utils/document-storage.js';

const recordId = new Types.ObjectId('68d2c50a8c4e1c843a39a300');
const storageId = new Types.ObjectId('68d2c50a8c4e1c843a39a301');
const organizationId = new Types.ObjectId('68d2c50a8c4e1c843a39a302');
const representativeId = new Types.ObjectId('68d2c50a8c4e1c843a39a303');

const storedDocument = {
  _id: recordId,
  organizationId,
  storageId,
  originalName: 'cac-certificate.pdf',
  contentType: 'application/pdf',
  byteSize: 1024,
};

function mockDocumentLookup(result: unknown) {
  vi.mocked(OrganizationDocument.findOne).mockReturnValue({
    lean: () => Promise.resolve(result),
  } as never);
}

function mockOrganizationLookup(result: unknown) {
  vi.mocked(Organization.findOne).mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(result) }),
  } as never);
}

describe('document access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(OrganizationDocument.deleteOne).mockResolvedValue({} as never);
    vi.mocked(deleteOrganizationDocument).mockResolvedValue(undefined);
  });

  it('resolves a document by either its record id or its storage id', async () => {
    mockDocumentLookup(storedDocument);
    mockOrganizationLookup({ _id: organizationId });

    await deleteDocument(recordId, representativeId);

    expect(OrganizationDocument.findOne).toHaveBeenCalledWith({
      $or: [{ _id: recordId }, { storageId: recordId }],
    });
  });

  it('deletes a document that belongs to the representative organization', async () => {
    mockDocumentLookup(storedDocument);
    mockOrganizationLookup({ _id: organizationId });

    await deleteDocument(recordId, representativeId);

    expect(Organization.findOne).toHaveBeenCalledWith({
      _id: organizationId,
      representativeUserId: representativeId,
    });
    expect(OrganizationDocument.deleteOne).toHaveBeenCalledWith({ _id: recordId });
    expect(deleteOrganizationDocument).toHaveBeenCalledWith(storageId);
  });

  it('refuses to delete a document owned by another organization', async () => {
    mockDocumentLookup(storedDocument);
    mockOrganizationLookup(null);

    await expect(deleteDocument(recordId, representativeId)).rejects.toMatchObject({
      statusCode: 404,
      code: 'DOCUMENT_NOT_FOUND',
    });

    expect(OrganizationDocument.deleteOne).not.toHaveBeenCalled();
    expect(deleteOrganizationDocument).not.toHaveBeenCalled();
  });

  it('reports an unknown document as not found', async () => {
    mockDocumentLookup(null);

    await expect(deleteDocument(recordId, representativeId)).rejects.toMatchObject({
      statusCode: 404,
      code: 'DOCUMENT_NOT_FOUND',
    });

    expect(Organization.findOne).not.toHaveBeenCalled();
    expect(OrganizationDocument.deleteOne).not.toHaveBeenCalled();
  });
});
