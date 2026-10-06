# Students module

Owns student profiles, academic details, preferences, and student-specific workflows. Reference identity accounts by ID rather than duplicating credentials in student documents.

## Profile fields

- Full name
- Phone number
- Institution
- Department
- Field of study
- Current level
- Expected SIWES duration (weeks)
- Preferred locations
- Skills

## API

- `GET /api/v1/students/me` returns the authenticated student's profile.
- `POST /api/v1/students/me` creates the authenticated student's profile.
- `PATCH /api/v1/students/me` updates the authenticated student's profile.
- `DELETE /api/v1/students/me` deletes the authenticated student's profile.

All routes require authentication and the `student` role. Each account can have at most one student profile.
