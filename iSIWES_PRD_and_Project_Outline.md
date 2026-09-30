# iSIWES Platform — Product Requirements Document

**Version:** 1.0  
**Created:** September 26, 2026  
**Architecture:** Modular Monolith using Clean Architecture  
**Technology:** React, TypeScript, Node.js, Express, Mongoose, MongoDB

---

## 1. Product Overview

iSIWES is a web-based platform intended to make it easier for Nigerian tertiary students to discover and apply for suitable SIWES/Industrial Training opportunities.

The platform will provide a centralized marketplace where students can discover placement opportunities based on factors such as field of study, location, duration, and requirements.

Organizations will be able to create verified profiles, publish SIWES opportunities, review applications, communicate with applicants, and manage their recruitment process.

Platform administrators will oversee organization verification, opportunity moderation, user management, and platform activity.

The initial product will focus specifically on SIWES and short-term industrial training opportunities, with potential expansion into broader internship and early-career opportunities based on future validation.

---

## 2. Problem Statement

The process of finding suitable SIWES placements can be fragmented and time-consuming.

Students may rely on personal connections, physical visits, university channels, social media groups, company websites, and other informal methods to discover opportunities. Existing portals and platforms may provide some support, but students can still experience difficulties identifying relevant organizations, determining which organizations are accepting students, submitting applications, and tracking responses.

Organizations also need an efficient way to advertise SIWES opportunities and identify students whose academic backgrounds and requirements match their needs.

The product will therefore investigate and address the gap between:

- Students seeking suitable SIWES placements
- Organizations seeking suitable SIWES students

The initial product assumptions will be validated through student surveys, interviews, organization interviews, and controlled MVP experiments before significant investment in the platform.

---

## 3. Product Vision

> To provide a trusted and accessible digital connection between Nigerian students seeking industrial training and organizations offering meaningful SIWES opportunities.

---

## 4. Goals and Objectives

The initial goals of iSIWES are to:

- Centralize SIWES placement opportunities in a searchable platform.
- Make relevant opportunities easier for students to discover.
- Reduce unnecessary time and effort involved in searching for placements.
- Help students identify opportunities relevant to their field of study and preferred location.
- Give organizations a structured way to publish opportunities and manage applications.
- Improve visibility into the student application process.
- Establish mechanisms for verifying organizations and reducing fraudulent opportunities.
- Provide a secure platform for managing student and organization information.
- Collect measurable data that can be used to evaluate the effectiveness of the platform.

Specific performance targets, such as reducing placement-search time by a particular percentage, will be established after baseline validation data has been collected.

---

## 5. Target Users

### 5.1 Students

Undergraduate and other eligible tertiary students seeking SIWES/Industrial Training placements.

**Primary needs**

- Discover suitable opportunities.
- Search by field of study and location.
- Understand organization and opportunity requirements.
- Apply without unnecessary friction.
- Track applications.
- Receive notifications about application progress.
- Identify legitimate organizations.

### 5.2 Organization Representatives

HR personnel, recruiters, managers, or authorized representatives of organizations that accept SIWES/Industrial Training students.

**Primary needs**

- Create an organization profile.
- Publish placement opportunities.
- Define requirements and available slots.
- Receive applications from suitable students.
- Review applicant information and documents.
- Manage application statuses.
- Communicate with applicants.

### 5.3 Platform Administrators

Authorized platform personnel responsible for operating and maintaining the marketplace.

**Primary needs**

- Verify organizations.
- Moderate opportunities.
- Manage users.
- Review reports and suspicious activity.
- Manage platform content.
- Monitor applications and system activity.
- Maintain audit records.

---

## 6. Core Product Concepts

The platform will revolve around the following core entities:

- Student
- Application
- Opportunity
- Organization

Additional supporting entities include:

- Institution
- Department
- Student Profile
- Organization Profile
- Document
- Notification
- Application Status History
- Organization Verification
- Audit Log

---

# 7. Functional Requirements

## 7.1 Authentication and Authorization

The system shall provide secure authentication for students, organization representatives, and administrators.

### Requirements

- User registration and login.
- Secure password storage.
- Email/account verification where required.
- Password recovery.
- Role-based authorization.
- Secure session/token management.
- Server-side authorization checks.

### Initial roles

- Student
- Organization Representative
- Administrator

---

## 7.2 Student Profiles

Students shall be able to create and manage profiles containing relevant academic and placement information.

A student profile may include:

- Full name
- Email address
- Phone number
- Institution
- Department
- Field of study
- Current level
- Expected SIWES duration
- Preferred location
- Relevant skills
- CGPA, where required
- CV
- Other approved supporting documents

The system should collect only information necessary for the platform's functionality.

---

## 7.3 Organization Profiles

Organizations shall be able to create profiles containing information relevant to students and platform verification.

A profile may include:

- Organization name
- Industry
- Description
- Address/location
- Website
- Contact information
- Authorized representative
- Organization documentation
- Verification status

Organizations shall have a verification status such as:

- Pending
- Verified
- Rejected
- Suspended

Only organizations that satisfy the platform's verification requirements should be permitted to publish opportunities.

---

## 7.4 Organization Verification

Administrators shall be able to review organization registration and supporting information.

### Verification workflow

```text
Organization Registration
        ↓
Pending Verification
        ↓
Administrator Review
        ↓
Verified / Rejected
        ↓
Opportunity Publishing
```

The exact verification requirements will be determined during product validation and legal/privacy research.

---

## 7.5 Placement Opportunities

Organizations shall be able to create SIWES placement opportunities.

An opportunity may contain:

- Title
- Description
- Field/discipline
- Required skills
- Academic requirements
- Location
- Work arrangement
- Duration
- Number of available slots
- Application deadline
- Required documents
- Additional requirements
- Opportunity status

### Possible opportunity statuses

- Draft
- Pending Review
- Published
- Closed
- Suspended

---

## 7.6 Search and Filtering

Students shall be able to discover opportunities using search and filters.

### Initial filters

- Field of study
- Industry
- Location
- Duration
- Application deadline
- Opportunity status

Future versions may introduce more advanced matching based on student profiles and organization requirements.

---

## 7.7 Application Management

Students shall be able to apply for suitable opportunities through the platform.

The system shall:

- Allow students to submit applications.
- Prevent duplicate applications to the same opportunity.
- Record application submission time.
- Allow students to view their applications.
- Allow organizations to view received applications.
- Allow organizations to update application statuses.
- Maintain application status history.

### Initial application statuses

```text
Submitted
    ↓
Under Review
    ↓
Shortlisted
    ↓
Interview
    ↓
Offer
    ↓
Accepted
```

### Alternative outcomes

- Rejected
- Withdrawn

---

## 7.8 Application Tracking

### Student dashboard

Students shall have access to a dashboard showing:

- Active applications
- Application status
- Organization
- Opportunity
- Application date
- Recent status changes
- Relevant notifications

### Organization dashboard

Organizations shall have access to:

- Open opportunities
- Applicant counts
- Applicant profiles
- Application statuses
- Available slots
- Recent applications

---

## 7.9 Notifications

The system shall provide in-app notifications for important events.

Examples include:

- Application submitted.
- Application status changed.
- Application accepted.
- Application rejected.
- New application received by an organization.
- Opportunity approved or rejected.
- Organization verification completed.

Email and other notification channels may be introduced in later versions.

---

## 7.10 Document Management

The platform may allow students and organizations to upload approved supporting documents.

Examples include:

- CV
- SIWES introduction letter
- Recommendation letter
- Other required documents

Files should be stored using secure object/file storage rather than directly inside MongoDB.

MongoDB should store document metadata such as:

- Document ID
- Owner
- Document type
- Original filename
- Storage reference
- File type
- File size
- Upload date

Access to documents must be authorized and auditable.

---

## 7.11 Administration

Administrators shall have access to an administration dashboard for:

- User management.
- Organization verification.
- Opportunity moderation.
- Organization suspension.
- User suspension where necessary.
- Report handling.
- Audit logs.
- Platform statistics.

---

# 8. Non-Functional Requirements

## 8.1 Security

The system shall:

- Securely hash passwords.
- Enforce authorization on protected operations.
- Validate and sanitize user input.
- Protect sensitive documents.
- Implement appropriate access controls.
- Record important security-sensitive actions.
- Protect against common web application vulnerabilities.

## 8.2 Privacy

The platform shall:

- Collect only necessary personal information.
- Restrict access to student documents.
- Provide appropriate privacy notices.
- Define data retention requirements.
- Support applicable Nigerian data protection requirements.

The exact legal and regulatory requirements will be confirmed before production deployment.

## 8.3 Performance

The platform should provide responsive API and user-interface performance under expected MVP workloads.

Database queries and search operations should be designed so that performance can scale as the number of students, organizations, opportunities, and applications increases.

## 8.4 Reliability

The platform should:

- Handle temporary dependency failures gracefully.
- Maintain database backups.
- Log significant system errors.
- Provide appropriate error handling.
- Prevent inconsistent application states during important transactions.

## 8.5 Maintainability

The backend shall:

- Follow Clean Architecture principles.
- Separate business logic from infrastructure concerns.
- Use dependency injection.
- Keep controllers thin.
- Use well-defined application use cases.
- Include automated tests for important business rules.

---

# 9. Architecture

## 9.1 Architectural Style

iSIWES will initially use a:

> **Modular Monolith implemented using Clean Architecture.**

This approach provides clear separation of responsibilities while keeping deployment and operational complexity low.

The system will not initially use microservices.

## 9.2 High-Level Architecture

```text
React + TypeScript
    ↓
Express API (Node.js)
    ↓
Presentation / Application / Domain
    ↓
Infrastructure
     ↓          ↓
 Mongoose   File Storage
     ↓
  MongoDB
```

## 9.3 Modular Structure

The application should be organized around business capabilities rather than technical features alone.

### Initial modules

- Identity
- Students
- Organizations
- Opportunities
- Applications
- Documents
- Notifications
- Administration

Each module should maintain clear boundaries and communicate through defined application interfaces.

---

# 10. Technology Stack

## Frontend

- React
- TypeScript
- Responsive web design

## Backend

- Node.js
- Express
- Mongoose

## Database

- MongoDB

## Authentication

- Role-based authentication for students, organization representatives, and administrators.
- A secure token or cookie-based session mechanism, with password hashing and server-side authorization middleware.

## File Storage

Object storage such as:

- Azure Blob Storage
- Amazon S3
- Cloudflare R2
- Equivalent service

## API Documentation

- OpenAPI / Swagger

## Testing

- Unit tests
- Integration tests
- API tests

---

# 11. Success Metrics

The platform will be evaluated using measurable indicators including:

### Placement Rate

Percentage of active student users who successfully secure a placement through the platform.

### Time to Placement

Average time between a student's active search and successful placement.

### Organization Onboarding

Number of verified organizations that publish at least one active opportunity during a defined period.

### Application Conversion

Percentage of submitted applications that progress to meaningful stages such as shortlist, interview, offer, or acceptance.

### Organization Retention

Percentage of organizations that return for subsequent SIWES cycles.

### Student Retention

Percentage of students who continue using the platform during their placement-search period.

### Platform Usage

Measures such as:

- Monthly active users.
- Number of active opportunities.
- Applications submitted.
- Applications received.
- Successful placements.

---

# 12. MVP Scope

The first version should focus on the smallest feature set capable of testing the core marketplace hypothesis.

## MVP should include

- Student registration and authentication.
- Organization registration.
- Organization verification.
- Student profiles.
- Organization profiles.
- Opportunity creation.
- Opportunity browsing.
- Search and filtering.
- Application submission.
- Application tracking.
- Organization applicant management.
- Basic in-app notifications.
- Basic administration dashboard.
- Basic document upload.

## MVP should NOT initially include

- AI-powered matching.
- Complex recommendation algorithms.
- University portal integrations.
- Mobile applications.
- Payment processing.
- Digital logbooks.
- Complex analytics.
- Real-time chat.
- Full-time job recruitment.

These features can be considered after the core marketplace has been validated.

---

# 13. Out of Scope

## Payment Processing

The platform will not initially process intern stipends, salaries, or organization subscription payments.

## Digital Logbooks

Daily attendance, logbook entries, supervisor grading, and detailed industrial-training reporting are excluded from the initial release.

## Full-Time Recruitment

The initial platform is focused on SIWES and short-term industrial training rather than permanent employment.

## Native Mobile Applications

The initial release will use a responsive web application rather than native Android or iOS applications.

## University Integration

Direct integration with university systems is considered a future capability rather than an MVP requirement.

---

# 14. Open Questions

## Student Verification

What is the most reliable and practical method for verifying that a student is currently enrolled in an institution?

How can iSIWES securely verify student enrollment using institution-provided data, institutional email, matriculation numbers, or future university integrations?

## Organization Verification

What documents and checks should be required before an organization can publish opportunities?

## Data Protection

What Nigerian data protection requirements apply to student profiles, academic information, CVs, and uploaded documents?

## University Integration

Would integration with university systems provide enough value to justify the technical and administrative complexity?

## Matching

Should future versions automatically match students with opportunities based on academic background, location, skills, duration, and requirements?

## Communication

Should organizations and students communicate through the platform, or should the platform initially facilitate applications without becoming a messaging platform?

## Business Model

If the platform gains traction, what sustainable business model would be appropriate without creating excessive barriers for students?

---

# 15. Validation Strategy

Before significant development investment, the product assumptions should be validated through:

- Student surveys.
- Student interviews.
- Organization interviews.
- Research into existing SIWES platforms and university systems.
- Manual placement experiments.
- Measurement of actual student demand.
- Measurement of organization willingness to participate.

### Primary validation question

> **Do students and organizations experience a sufficiently significant problem with the current SIWES placement process that a dedicated platform provides meaningful additional value over existing alternatives?**

Development priorities should be adjusted based on the evidence collected.

---

# 16. Future Possibilities

Depending on validation results, future versions may include:

- Intelligent opportunity matching.
- University integrations.
- Institution verification.
- Email notifications.
- WhatsApp notifications.
- In-platform messaging.
- Digital SIWES documentation.
- Supervisor functionality.
- Digital logbooks.
- Placement analytics.
- Organization subscriptions.
- Broader internship and graduate opportunities.

These features are intentionally excluded from the initial MVP to maintain focus.

---

# 17. Implementation Outline

> **Note:** This section is an implementation plan derived from the PRD's MVP scope. It is not part of the original PRD requirements and is intended to help break development into manageable milestones.

## Phase 0 — Project Foundation

### Goal

Create the application structure and development environment before implementing business features.

### Tasks

- Create Git repository.
- Create a Node.js + Express API project.
- Create React + TypeScript frontend.
- Set up Clean Architecture-inspired layers within the backend.
- Set up the modular structure.
- Configure MongoDB.
- Configure Mongoose schemas, models, and indexes.
- Configure dependency injection.
- Configure environment variables.
- Configure OpenAPI documentation.
- Set up basic error handling.
- Set up Git branching strategy.
- Define an approach for versioning and applying database schema/data changes.
- Establish coding conventions.

### Suggested backend structure

```text
src/
├── Domain/
├── Application/
├── Infrastructure/
└── Presentation/
```

### Suggested business modules

```text
Modules/
├── Identity/
├── Students/
├── Organizations/
├── Opportunities/
├── Applications/
├── Documents/
├── Notifications/
└── Administration/
```

---

## Phase 1 — Identity and Authentication

### Goal

Allow users to register, log in, and access functionality according to their roles.

### Implement

1. User model and authentication setup.
2. Student role.
3. Organization Representative role.
4. Administrator role.
5. Registration.
6. Login.
7. Logout/session handling.
8. Password hashing.
9. Password recovery.
10. Role-based authorization middleware.
11. Protected API endpoints.
12. Frontend authentication state.

### First milestone

> A student, organization representative, and administrator can each log in and only access functionality permitted to their role.

---

## Phase 2 — Student Profiles

### Goal

Allow students to create the information needed to discover and apply for opportunities.

### Implement

1. Student profile entity.
2. Institution.
3. Department.
4. Field of study.
5. Current level.
6. Expected SIWES duration.
7. Preferred location.
8. Skills.
9. CGPA where required.
10. Profile creation/update endpoints.
11. Profile page.
12. Profile validation.

### First milestone

> A student can register, complete their profile, edit it, and retrieve it from the API.

---

## Phase 3 — Organization Profiles and Verification

### Goal

Allow organizations to register and become verified before publishing opportunities.

### Implement

1. Organization profile.
2. Authorized representative.
3. Organization documents.
4. Verification status.
5. Organization registration flow.
6. Admin verification queue.
7. Approve organization.
8. Reject organization.
9. Suspend organization.
10. Authorization preventing unverified organizations from publishing opportunities.

### First milestone

> An organization can register, an administrator can review it, and only verified organizations can proceed to publish opportunities.

---

## Phase 4 — Placement Opportunities

### Goal

Allow verified organizations to create and manage SIWES opportunities.

### Implement

1. Opportunity entity.
2. Create opportunity.
3. Edit opportunity.
4. Save draft.
5. Submit for review.
6. Admin moderation.
7. Publish opportunity.
8. Close opportunity.
9. Suspend opportunity.
10. Opportunity detail page.

### Opportunity lifecycle

```text
Draft
  ↓
Pending Review
  ↓
Published
  ↓
Closed
```

With:

```text
Pending Review → Rejected
Published → Suspended
```

### First milestone

> A verified organization can create an opportunity and an administrator can approve it for students to see.

---

## Phase 5 — Opportunity Discovery

### Goal

Allow students to find relevant opportunities.

### Implement

1. Opportunity listing.
2. Opportunity details.
3. Search.
4. Field-of-study filter.
5. Industry filter.
6. Location filter.
7. Duration filter.
8. Application deadline filter.
9. Opportunity status filtering.
10. Pagination.

### First milestone

> A student can browse published opportunities and narrow the results using meaningful filters.

---

## Phase 6 — Applications

### Goal

Create the core marketplace transaction: a student applies to an opportunity.

### Implement

1. Application entity.
2. Submit application.
3. Prevent duplicate applications.
4. Record submission time.
5. Attach required documents.
6. Student application list.
7. Organization applicant list.
8. Applicant details.
9. Application status changes.
10. Status history.

### Application lifecycle

```text
Submitted
    ↓
Under Review
    ↓
Shortlisted
    ↓
Interview
    ↓
Offer
    ↓
Accepted
```

Alternative outcomes:

```text
Rejected
Withdrawn
```

### First milestone

> A student can apply to an opportunity and the organization can review and update that application.

---

## Phase 7 — Application Tracking

### Goal

Give both sides visibility into the recruitment process.

### Student dashboard

Show:

- Active applications.
- Organization.
- Opportunity.
- Application date.
- Current status.
- Recent status changes.

### Organization dashboard

Show:

- Open opportunities.
- Applicant counts.
- Recent applications.
- Applicant profiles.
- Application statuses.
- Available slots.

### First milestone

> Both students and organizations can clearly see the current state of their applications and opportunities.

---

## Phase 8 — Documents

### Goal

Securely manage CVs and approved supporting documents.

### Implement

1. File upload.
2. Object storage integration.
3. Document metadata.
4. Document ownership.
5. Authorized download/viewing.
6. File type validation.
7. File size validation.
8. Document deletion/replacement.
9. Audit logging.

### Important architecture rule

```text
File
 ↓
Object Storage

Metadata
 ↓
MongoDB
```
Do not store the actual files inside MongoDB.

---

## Phase 9 — Notifications

### Goal

Keep users informed about important events.

### Initial events

- Application submitted.
- New application received.
- Application status changed.
- Application accepted.
- Application rejected.
- Opportunity approved/rejected.
- Organization verification completed.

### First implementation

Start with **in-app notifications**.

Email and WhatsApp notifications can come later.

---

## Phase 10 — Administration

### Goal

Give administrators enough control to operate the marketplace.

### Implement

- User management.
- Organization verification.
- Opportunity moderation.
- Organization suspension.
- User suspension.
- Report handling.
- Audit logs.
- Basic platform statistics.

### First milestone

> An administrator can operate the marketplace without directly modifying the database.

---

## Phase 11 — Security, Testing and Reliability

### Goal

Make the MVP safe and dependable before real users use it.

### Security

- Authorization checks.
- Input validation.
- Secure password handling.
- Document access control.
- Rate limiting where appropriate.
- Protection against common web vulnerabilities.
- Audit sensitive actions.

### Testing

- Domain/business-rule unit tests.
- Application/use-case tests.
- API integration tests.
- Authentication tests.
- Authorization tests.
- Application workflow tests.

### Reliability

- Database backups.
- Structured logging.
- Global exception handling.
- Transaction handling for important operations.
- Dependency failure handling.

---

## Phase 12 — MVP Deployment

### Goal

Put the validated MVP in the hands of real users.

### Tasks

- Production database.
- Backend deployment.
- Frontend deployment.
- Object storage configuration.
- Production environment variables.
- HTTPS.
- Database indexes and versioned schema/data changes.
- Logging/monitoring.
- Backup strategy.
- Production Swagger configuration.
- Basic analytics.

---

# 18. Recommended Development Order

The implementation should follow the dependency chain rather than attempting every feature simultaneously:

```text
Foundation
    ↓
Authentication
    ↓
Student Profiles
    ↓
Organization Profiles
    ↓
Organization Verification
    ↓
Opportunities
    ↓
Opportunity Discovery
    ↓
Applications
    ↓
Application Tracking
    ↓
Documents
    ↓
Notifications
    ↓
Administration
    ↓
Testing + Security + Reliability
    ↓
Deployment
```

The core marketplace loop is:

```text
Organization
    ↓
Creates Opportunity
    ↓
Admin Verifies/Approves
    ↓
Student Discovers Opportunity
    ↓
Student Applies
    ↓
Organization Reviews Application
    ↓
Organization Updates Status
    ↓
Student Tracks Application
    ↓
Accepted / Rejected / Withdrawn
```

That loop should be treated as the central MVP journey.

---

# 19. Feature-by-Feature Working Method

For each feature, use the same development cycle:

### 1. Define the requirement

What exactly does the PRD require?

### 2. Define the domain model

What entities, properties, relationships, and business rules are needed?

### 3. Design the use case

What should the user be able to do?

### 4. Implement the backend

Typical flow:

```text
Express Route / Controller
    ↓
Application Use Case
    ↓
Domain
    ↓
Infrastructure
    ↓
Mongoose / External Service
```

### 5. Implement the API

Define:

- Endpoint
- HTTP method
- Request DTO
- Response DTO
- Validation
- Authorization
- Error responses

### 6. Implement the frontend

Build:

- Page
- Form
- API integration
- Loading state
- Error state
- Success state
- Authorization-aware UI

### 7. Test

Test the happy path and important failure cases.

### 8. Commit

Use a focused Git commit for the completed feature.

---

# 20. Important MVP Principle

Do not implement every item in the PRD at once.

Build vertically.

For example, instead of doing all student functionality first:

```text
Student registration
Student profile
Student dashboard
Student notifications
Student documents
Student applications
```

build one complete journey:

```text
Student registers
      ↓
Completes profile
      ↓
Views opportunities
      ↓
Opens opportunity
      ↓
Applies
      ↓
Sees application
```

Then build the organization side that completes that journey:

```text
Organization registers
      ↓
Gets verified
      ↓
Creates opportunity
      ↓
Receives application
      ↓
Reviews applicant
      ↓
Changes application status
```

This produces a working marketplace much earlier and makes it easier to test with real users.
