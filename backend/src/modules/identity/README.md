# Identity module

Owns account registration, login, password recovery, session management, student account details, and role-based authorization.

## Routes

- `POST /api/v1/auth/register` creates a student or organization-representative account. Administrator accounts are provisioned outside public registration.
- `POST /api/v1/auth/login` creates a seven-day bearer session for any active account role, including students and organization representatives.
- `POST /api/v1/auth/logout` revokes the current bearer session.
- `GET /api/v1/auth/me` returns the current account and, for students, the student profile.
- `POST /api/v1/auth/password/forgot` requests a single-use password-reset token.
- `POST /api/v1/auth/password/reset` consumes a reset token and revokes all sessions.
- `PUT /api/v1/auth/password` changes the current password and revokes all sessions.
- `PATCH /api/v1/auth/student-profile` updates the authenticated student's profile.

All routes except registration, login, and password recovery/reset require `Authorization: Bearer <token>` where indicated. User and reset tokens are random opaque values; only SHA-256 hashes are persisted. Passwords are stored using Node.js scrypt with a per-password random salt.

Password recovery sends an email when SMTP is configured using `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional `SMTP_USER`/`SMTP_PASSWORD`, and `SMTP_FROM`. The link targets `/reset-password` on `WEB_APP_URL`. Without SMTP, development and test responses include the one-time token for local workflows. Production deployments must configure SMTP before enabling password recovery.

## Test password recovery with Mailtrap

For development, create a Mailtrap **Email Testing** inbox and copy the SMTP host, username, and password from that inbox's SMTP settings into `backend/.env`:

```dotenv
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=isiwes@example.com
WEB_APP_URL=http://localhost:5173
```

Use the host and credentials displayed in your own Mailtrap inbox if they differ. Restart the API after updating `.env`, then send `POST /api/v1/auth/password/forgot` with the email of an existing account. Open the Mailtrap inbox to inspect the message. Email Testing captures messages in Mailtrap; it does not deliver them to a real mailbox. For real delivery, use Mailtrap Email Sending and a verified sender domain.

The email link opens `/reset-password` on `WEB_APP_URL`, so a frontend route must exist there to accept a new password. Until that page is implemented, copy the `token` query parameter from the Mailtrap link and send it to `POST /api/v1/auth/password/reset` with a new password. On send failure, the API logs the SMTP error code, response code, command, host, and port, but never logs credentials or reset tokens; check the backend terminal.

Email verification is not enforced in this initial implementation; `emailVerifiedAt` is reserved for the later verification workflow.
