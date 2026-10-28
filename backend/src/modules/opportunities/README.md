# Opportunities module

Owns SIWES opportunity creation, moderation state, discovery, and lifecycle rules. Store references to organizations and add indexes based on measured search and filtering needs.

## Lifecycle

```text
Draft -> Pending Review -> Published -> Closed
						  |          |
						  v          v
					  Rejected   Suspended
						  |
						  +-> Pending Review
```

Only representatives of currently verified organizations can create or manage opportunities. Representatives can edit draft or rejected opportunities, submit them for review, and close published opportunities. Administrators can approve or reject pending opportunities and suspend published opportunities. State transitions and immutable moderation events are committed in MongoDB transactions.

Public listing and detail endpoints expose only published opportunities with future application deadlines and currently verified organizations. The discovery endpoint supports search by title, description, or field of study, and filtering by field of study, industry, location, duration, and work arrangement. Results are paginated.

## API

- `POST /api/v1/opportunities/me` creates a draft for the authenticated verified organization.
- `GET /api/v1/opportunities/me` lists that organization's opportunities.
- `GET /api/v1/opportunities/me/:opportunityId` returns an owned opportunity.
- `PATCH /api/v1/opportunities/me/:opportunityId` updates a draft or rejected opportunity.
- `POST /api/v1/opportunities/me/:opportunityId/submit` submits a draft or rejected opportunity for review.
- `POST /api/v1/opportunities/me/:opportunityId/close` closes a published opportunity.
- `GET /api/v1/opportunities` searches and filters published opportunities with pagination.
- `GET /api/v1/opportunities/filters` returns available filter options.
- `GET /api/v1/opportunities/:opportunityId` returns an available published opportunity.
- `GET /api/v1/opportunities/admin/opportunities` lists pending opportunities; administrators may filter by status.
- `GET /api/v1/opportunities/admin/opportunities/:opportunityId` returns the opportunity and moderation history.
- `POST /api/v1/opportunities/admin/opportunities/:opportunityId/approve` publishes a pending opportunity.
- `POST /api/v1/opportunities/admin/opportunities/:opportunityId/reject` rejects a pending opportunity with a reason.
- `POST /api/v1/opportunities/admin/opportunities/:opportunityId/suspend` suspends a published opportunity with a reason.

Run MongoDB as a replica set for atomic state and audit-event transactions. Organization verification remains authoritative: moderation rechecks it before publication, and public reads suppress opportunities belonging to organizations that are no longer verified.
