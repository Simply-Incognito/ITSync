# Organizations module

Owns organization profiles, representative membership, private KYB evidence, and verification status.

## Verification flow

1. An organization representative creates a profile with its legal name, country, registration number, address, and representative details.
2. The representative uploads a CAC certificate, proof of authority to represent the organization, and proof of address. Uploads are limited to 5 MB and PDF/JPEG/PNG content is checked by file signature, stored privately in GridFS, and recorded with a SHA-256 digest. Successful evidence downloads are also recorded in the review history.
3. The representative submits the profile for review. The API checks that all three required document categories exist and moves the profile to `pending`.
4. An administrator independently checks the relevant company registry, confirms the legal name and registration number, representative authority, independently sourced contact details, and document authenticity. The approval endpoint requires every check and records the registry source/reference, reviewer, decision, timestamp, and note in an append-only review event.
5. Administrators can reject or suspend profiles with a reason. Rejected profiles can add evidence and resubmit; suspension immediately makes the verified-organization middleware deny access.

The API does not claim automatic CAC or identity verification. Staff must perform those checks against an authoritative registry and contact channel obtained independently of the applicant. Keep evidence access restricted, establish a retention/deletion policy, and confirm applicable Nigerian data-protection and CAC requirements before production use.

Review state transitions use MongoDB transactions so the organization state and audit event commit together. Run MongoDB as a replica set; standalone MongoDB does not support these transactions.

## API

- `POST /api/v1/organizations` creates the authenticated representative's profile.
- `GET /api/v1/organizations/me` returns the representative's profile and document metadata.
- `PATCH /api/v1/organizations/me` edits profile fields only in `draft` or `rejected` status.
- `POST /api/v1/organizations/me/documents` accepts multipart fields `documentType` and `file`.
- `GET /api/v1/organizations/me/documents/:documentId` downloads only that representative's document.
- `POST /api/v1/organizations/me/verification` submits the profile for review.
- `GET /api/v1/organizations/admin/organizations` lists pending profiles; administrators may filter by status.
- `GET /api/v1/organizations/admin/organizations/:organizationId` returns review details and audit events.
- `GET /api/v1/organizations/admin/organizations/:organizationId/documents/:documentId` allows administrator-only evidence access.
- `POST /api/v1/organizations/admin/organizations/:organizationId/approve` approves only a pending profile and requires every verification check plus a registry source and reference.
- `POST /api/v1/organizations/admin/organizations/:organizationId/reject` and `/suspend` require a reason.

Attach `requireVerifiedOrganization` after authentication on every organization-owned opportunity create/edit/publish and application-management route. The middleware queries the current database status on each request; do not rely on a status copied into a long-lived token. Opportunity and application routes do not exist in this repository yet, so the gate is provided for those modules but cannot be attached there until they are implemented.
