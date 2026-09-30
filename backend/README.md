# iSIWES API

Node.js + TypeScript API for the iSIWES placement platform. The backend is a modular monolith: business capabilities live in `src/modules`, and shared application concerns live in `src/config`, `src/database`, `src/middleware`, `src/errors`, and `src/utils`.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- MongoDB 6 or newer, local or hosted

## Setup on Windows PowerShell

From the `backend` directory:

```powershell
Copy-Item .env.example .env
npm install
```

Update `MONGODB_URI` in `.env` to point to a running MongoDB instance. The example value works with a local MongoDB server listening on its default port.

Start the API in development mode:

```powershell
npm run dev
```

By default the API listens on `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/api/v1/docs`.

## Useful commands

```powershell
npm run typecheck
npm test
npm run lint
npm run format:check
npm run build
npm start
```

## API starter endpoints

- `GET /api/v1/health` checks that the process is serving requests.
- `GET /api/v1/health/ready` checks process and MongoDB readiness.
- `GET /api/v1/openapi.json` returns the OpenAPI document.
- `GET /api/v1/docs` serves interactive API documentation.

## Structure

```text
src/
  app.ts                  Express application composition
  server.ts               Process entry point and graceful shutdown
  config/                 Environment and API documentation config
  database/               Mongoose connection lifecycle
  errors/                 Shared application error types
  middleware/             Shared Express middleware
  modules/                Business capabilities, organized by feature
  utils/                  Small shared utilities

tests/                    Automated tests
```

Each module owns its routes, controllers, services, models, validation, and tests as the feature is implemented. Keep HTTP handling in controllers and business rules in services. Avoid adding extra architectural layers until a module has a concrete need for them.

## MongoDB modeling notes

Use references for entities with independent lifecycles, such as users, organizations, opportunities, and applications. Embed small data that is read and updated with its parent. Add indexes for real query patterns, and keep uploaded file contents in private object storage while MongoDB stores document metadata and storage references.

## Environment variables

See `.env.example`. Configuration is validated at startup; the process exits with a clear configuration error when required values are missing or invalid. Keep `.env` out of version control.

## Current scope

This scaffold includes the API foundation and health routes. Feature modules are intentionally documented placeholders; implement business flows incrementally, starting with identity and profiles, then verified organizations, opportunities, and applications.
