1. The Golden Rule: Approval First

You are strictly forbidden from writing, modifying, or deleting code without an approved Code Plan. Before any implementation, you must submit a Code Plan for review. This plan must include:

Objective: What specific Roadmap item are you addressing?

Proposed Changes: A list of files to be created or modified.

Logic Overview: A brief explanation of the algorithms or data flow.

Dependencies: Any new libraries you intend to install (must be approved).

2. Tech Stack & Constraints

Stick to these technologies. Do not substitute without explicit permission.

Layer	Technology
Runtime / Framework	Node.js + Express (TypeScript)
ORM / Database	Prisma + SQLite
Authentication	Firebase Admin SDK (OTC/JWT)
Validation	Zod (for Config & API Requests)
Security	Helmet, Express-Rate-Limit
Error Standards	RFC 9457 (Problem Details for HTTP APIs)
Notifications	Expo Server SDK
Testing	Jest + Supertest

3. Implementation Restrictions

Import Discipline: Do not use functions or classes from libraries that are not explicitly imported at the top of the file. Do not assume a library is globally available.

No Ghost Code: Do not write "placeholder" functions or // TODO comments unless specifically instructed to.

Zero-UI Policy: This is a headless middleware service. Do not generate React, HTML, or CSS.

Schema First: Any database changes must include a Prisma schema update and a migration plan.

UUID Standards: All primary keys (id) must utilize UUIDv7.

4. Code Style & Architecture

Directory Scaffolding: Adhere strictly to the /src/routes, /src/controllers, /src/services structure defined in the Spec.

Logic Isolation: * Routes: Define endpoints and attach middleware.

Controllers: Handle request/response orchestration.

Services: Contain the actual business logic (e.g., WordPress stripping, Firebase verification).

Error Handling: Every catch block must pass the error to the global errorHandler middleware. Never send raw error strings to the client.

5. RFC 9457 Error Compliance

All error responses must follow this shape:

JSON
{
  "type": "https://api.retrogradenews.app/errors/<error-slug>",
  "title": "<Short Human Readable Title>",
  "status": 400,
  "detail": "<Specific explanation of what went wrong>",
  "instance": "<The request path>"
}
6. Environment Safety

Never hardcode secrets.

Always use src/utils/config.ts (Zod-validated) to access environment variables.

If a required variable is missing, the application must process.exit(1).

Acknowledgment: By proceeding, the AI agent agrees to these constraints. Failure to follow the "Code Plan First" rule will result in a rejected task.

7. Relevent Files
@backend-spec-doc.md

# 🛠️ Retrograde Backend Implementation Roadmap

## Phase 1.0: Foundation & Environment Setup

- [x] **1.1 Project Initialization**
  - [x]  Initialize `npm init - [ ] y` and install: `express`, `dotenv`, `helmet`, `morgan`, `zod`, `uuid`.
  - [x]  Install dev dependencies: `typescript`, `@types/node`, `@types/express`, `ts- [ ] node- [ ] dev`, `jest`, `supertest`.

- [x] **1.2 Directory Scaffolding**
  - [x]  Create the `src/` folder tree: `routes`, `controllers`, `middleware`, `services`, `utils`.
  - [x]  Create empty `.ts` files for all endpoints defined in the spec.

- [x] **1.3 Strict Environment Validation**
  - [x]  Implement `src/utils/config.ts` using Zod to validate all Section 11 variables.
  - [x]  Ensure the process exits with code 1 if `FIREBASE_SERVICE_ACCOUNT` or `DATABASE_URL` is missing.

- [ ] **1.4 Basic Server Setup**
  - [x]  Configure `app.ts` with security middleware (`helmet`).
  - [x]  Set up `server.ts` to listen on the configured port.

## Phase 1.1: Core Middleware & Error Standards

- [x] **2.1 RFC 9457 Error Handling**
  - [x]  Create `src/middleware/errorHandler.ts` to intercept all errors.
  - [x]  Map standard HTTP errors to the specified JSON "Problem Details" shape.

- [x] **2.2 Multi- [ ] Tier Rate Limiting**
  - [x]  Implement `src/middleware/rateLimiter.ts`.
  - [x]  Define separate stores for Public (30/min), Auth (120/min), and OTP (5/15min) limits.

- [x] **2.3 Logging Utility**
  - [x]  Implement `src/utils/logger.ts` (using Winston or Pino) for standardized request/error logging.

## Phase 1.2: Database & User Persistence (SQLite)

- [ ] **3.1 Schema Definition**
  - [ ]  Initialize Prisma with SQLite.
  - [ ]  Create migrations for User, Bookmark, and PushToken tables.
  - [ ]  Ensure `id` fields utilize UUIDv7 logic.

- [ ] **3.2 User Service Layer**
  - [ ]  Implement `src/services/user.ts` for database interactions (Find/Create/Delete).

## Phase 1.3: WordPress Content Proxy (The MVP Core)

- [ ] **4.1 WordPress Data Service**
  - [ ]  Implement `src/services/wordpress.ts` using `axios` or `fetch`.
  - [ ]  Create a "Stripper" function to remove excessive WordPress metadata.

- [ ] **4.3 Integration Test: Feed**
  - [ ]  Write a Jest test to verify that the WP Proxy returns a clean, versioned JSON response.

## Phase 1.4: Passwordless Authentication (Firebase)

- [ ] **5.1 Firebase Admin Integration**
  - [ ]  Initialize Firebase in `src/utils/firebase.ts`.

- [ ] **5.2 OTP Flow Implementation**
  - [ ]  Implement `POST /v1/auth/otp` to trigger the OTC email via Firebase.
  - [ ]  Implement `POST /v1/auth/verify` to validate codes and issue local JWTs.

- [ ] **5.3 Account Auto- [ ] Provisioning**
  - [ ]  Ensure `/verify` creates a new record in SQLite if the email is new.

- [ ] **5.4 Authorization Middleware**
  - [ ]  Create `src/middleware/auth.ts` to guard protected routes using the Bearer token.

## Phase 1.5: Bookmarks & Push Notifications

- [ ] **6.1 Bookmarks CRUD**
  - [ ]  Implement GET, POST, and DELETE in `src/routes/bookmarks.ts`.
  - [ ]  Enforce user- [ ] isolation (users can only see/delete their own bookmarks).

- [ ] **6.2 Expo Push Service**
  - [ ]  Implement `src/services/expoPush.ts` using `expo- [ ] server- [ ] sdk`.

- [ ] **6.3 Token Management**
  - [ ]  Implement `POST /notifications/token` to link device tokens to the active user.
  - [ ]  Implement `PATCH /notifications/preferences` for notification settings.

## Phase 1.6: Final MVP Validation

- [ ] **7.1 End- [ ] to- [ ] End Integration Test**
  - [ ]  Simulate: Login - [ ] > Get Feed - [ ] > Bookmark Article - [ ] > Verify Bookmark exists in DB.

- [ ] **7.2 API Documentation Check**
  - [ ]  Ensure all Phase 1 endpoints match the 8.0 API Reference in the spec exactly.