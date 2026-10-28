# Application Tracking module

Owns application dashboard views for students and organizations, and application status history retrieval.

## Student Dashboard

- `GET /api/v1/application-tracking/me` returns the authenticated student's active applications and application count.

## Organization Dashboard

- `GET /api/v1/application-tracking/organization/me` returns the authenticated organization representative's open opportunities, applicant counts, recent applications, and available slots.

## Application Review

- `GET /api/v1/application-tracking/:applicationId` returns the application details and audit history.
- `GET /api/v1/application-tracking/:applicationId/history` returns the complete status history of an application.

All routes require appropriate role-based authentication.