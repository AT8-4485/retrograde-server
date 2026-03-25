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
Authentication	WorkOS (Magic Auth OTP / JWT)
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

Services: Contain the actual business logic (e.g., WordPress stripping, WorkOS verification).

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
  - [x]  Ensure the process exits with code 1 if `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, or `DATABASE_URL` is missing.

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

- [x] **3.1 Schema Definition**
  - [x]  Initialize Prisma with SQLite.
  - [x]  Create migrations for User, Bookmark, and PushToken tables.
  - [x]  Ensure `id` fields utilize UUIDv7 logic.

- [x] **3.2 User Service Layer**
  - [x]  Implement `src/services/user.ts` for database interactions (Find/Create/Delete).

 ## Phase 1.3: WordPress Content Proxy (The MVP Core)

- [x] **4.1 Define Data Interfaces**
  - [x]  Create a "Lean" TypeScript interface representing the optimized data the mobile client will receive (`id`, `title`, `excerpt`, `content`, `thumbnailUrl`, `authorName`, `publishedAt`, `categories`).
  - [x]  Define the incoming WordPress `Post` interface, strictly typing the deeply nested `_embedded` object for media and authors.

- [x] **4.2 WordPress Data Service**
  - [x]  Implement `src/services/wordpress.ts` using `axios` or native `fetch` utilizing the `WORDPRESS_API_BASE_URL`.
  - [x]  Configure the fetcher to automatically append `_embed=true` to requests to prevent secondary HTTP calls.
  - [x]  Configure the fetcher to accept pagination (`page`, `per_page`) and category exclusions (e.g., `WP_CATEGORIES.ISSUE`).
  - [x]  Create a "Stripper" function to map the raw WordPress JSON array to the Lean interface array.
  - [x]  Implement safe navigation (optional chaining `?.`) inside the Stripper to handle posts that might be missing a featured image or author without crashing.

- [x] **4.3 News Feed Route**
  - [x]  Implement `GET /v1/feed` in `src/routes/feed.ts`.
  - [x]  Extract `cursor` (translates to WP `page` number) and `limit` (translates to WP `per_page`) from the request query parameters.
  - [x]  Wrap the transformed Lean articles into the standard Pagination Envelope (`{ data: [...], cursor: "next_page_number", hasMore: boolean }`).

- [x] **4.4 Integration Test: Feed**
  - [x]  Write a Jest test in `tests/feed.test.ts` that mocks a standard WordPress REST API response.
  - [x]  Verify that the proxy correctly strips the payload and returns the clean Pagination Envelope.
  - [x]  Verify that the proxy returns the strictly formatted RFC 9457 JSON error if the CMS is down or unreachable.

- [x] **4.3 Integration Test: Feed**
  - [x]  Write a Jest test to verify that the WP Proxy returns a clean, versioned JSON response.

## Phase 1.4: WordPress Proxy Refactoring & Features

Refactor the `wordpress.ts` service to support DRY (Don't Repeat Yourself) API calls, and implement category filtering, issue fetching, and date-bounded article fetching. Expose these new capabilities through expanded routes in `src/routes/feed.ts`.

**Dependencies to Install:**
- `date-fns` (Required for calculating the strict startOfDay and endOfDay ISO strings for WordPress date filtering, identical to the reference client code).

- [x] **5.1 Define Taxonomies**
  - [x]  Create `src/utils/wordpressTaxonomies.ts`.
  - [x]  Export a `WP_CATEGORIES` constant object containing the exact IDs from the reference file (NEWS: 1363, OPINION: 1364, LIFE_ARTS: 1365, COMICS: 1366, ISSUE: 1407).

- [x] **5.2 Refactor src/services/wordpress.ts**
  - [x]  Extract Base Fetcher: Create a private helper function `fetchFromWP(queryParams: URLSearchParams)` that handles the native fetch, error checking (throwing ApiError), extracting `X-WP-TotalPages`, and applying the dataStripper.
  - [x]  Update `fetchFeed`: Refactor the existing feed function to use `fetchFromWP`, ensuring it always excludes the ISSUE category (`categories_exclude=WP_CATEGORIES.ISSUE`).
  - [x]  Add `fetchFeedByCategory`: Create a function accepting an array of `categoryIds`, `page`, and `limit`. Append the IDs as a comma-separated string to the `categories` parameter. Always exclude the ISSUE category.
  - [x]  Add `fetchIssues`: Create a function to fetch a paginated list of issue containers by targeting `categories=WP_CATEGORIES.ISSUE`.
  - [x]  Add `fetchLatestIssue`: Create a function that fetches exactly 1 post (`per_page=1`) from the ISSUE category.
  - [x]  Add `fetchArticlesByDate`: Create a function accepting a date string. Use `date-fns` to calculate `after` (start of day ISO) and `before` (end of day ISO). Fetch up to 100 articles falling within that window, excluding the ISSUE category.

- [x] **5.3 Expand Routes in src/routes/feed.ts**
  - [x]  GET `/` (Existing): Keep the current feed, but ensure it utilizes the refactored service.
  - [x]  GET `/category`: Create a new route. Expect a `categories` query parameter (e.g., `?categories=1363,1364`). Parse and validate this with Zod into an array of numbers, then call `fetchFeedByCategory`. Return the standard Pagination Envelope.
  - [x]  GET `/issues`: Create a new route for the paginated archive of past issues. Return the standard Pagination Envelope.
  - [x]  GET `/issues/latest`: Create a route that first calls `fetchLatestIssue()`. If an issue exists, extract its `publishedAt` date, then immediately call `fetchArticlesByDate(publishedAt)`. Return a custom JSON payload containing both the issue details and its associated articles: `{ issue: LeanArticle, articles: LeanArticle[] }`.

- [x] **5.4 Update Integration Tests**
  - [x]  Update `tests/feed.test.ts` to mock the new routes.
  - [x]  Add a specific test for `/v1/feed/issues/latest` to ensure it successfully orchestrates the dual-fetch (fetching the issue, then fetching the articles for that issue's date).

## Phase 1.5: Passwordless Authentication (WorkOS Magic Auth + Stateful Sessions)

- [x] **6.1 WorkOS Integration & Dependencies**
  - [x]  Install `@workos-inc/node`, `jsonwebtoken`, and `uuid` (plus `@types/jsonwebtoken` for dev).
  - [x]  Add `JWT_SECRET`, `JWT_REFRESH_SECRET`, `WORKOS_API_KEY`, and `WORKOS_CLIENT_ID` to the Zod schema in `src/utils/config.ts`.
  - [x]  Initialize the WorkOS SDK in `src/utils/workos.ts` using the config.

- [x] **6.2 Database Schema Update (Stateful Sessions)**
  - [x]  Update `prisma/schema.prisma` to include a `Session` model. It should include `id` (UUIDv7), `userId` (relation to User), `jti` (String, unique), and `expiresAt` (DateTime).
  - [x]  Create the Prisma migration for the new table.
  - [x]  Update `src/services/user.ts` (or create `src/services/session.ts`) to handle creating, finding, and deleting sessions.

- [x] **6.3 Token Verification & Issuance**
  - [x]  Create `POST /v1/auth/request-otp` to send a Magic Auth code via WorkOS (`sendMagicAuthCode`).
  - [x]  Create `POST /v1/auth/verify-otp` to verify the code via WorkOS (`authenticateWithMagicAuth`) and extract the email.
  - [x]  Check the SQLite database; if the email is new, auto-provision a new User record (UUIDv7).
  - [x]  Generate a short-lived **Access Token** (e.g., 15m) using `JWT_SECRET`.
  - [x]  Generate a unique `jti` (UUIDv7). Create a long-lived **Refresh Token** (e.g., 60d) containing this `jti` using `JWT_REFRESH_SECRET`.
  - [x]  Save the `jti` and user relationship to the `Session` table in SQLite.
  - [x]  Return both the Access Token and Refresh Token to the client.

- [x] **6.4 Refresh & Revocation (Logout) Routes**
  - [x]  Create `POST /v1/auth/refresh`. Accept a Refresh Token, verify its signature, and extract the `jti`. Check the `Session` table to ensure that `jti` is still active. If valid, issue a fresh 15m Access Token.
  - [x]  Create `POST /v1/auth/logout`. Accept a Refresh Token (or `jti`), and delete the corresponding record from the `Session` table, instantly revoking its ability to generate new Access Tokens.

- [x] **6.5 Authorization Middleware**
  - [x]  Create `src/middleware/auth.ts` to guard protected routes.
  - [x]  Extract the Bearer token from the `Authorization` header and verify it using `jsonwebtoken` and `JWT_SECRET`.
  - [x]  Extend the Express `Request` type namespace to attach the decoded JWT payload to `req.user`.
  - [x]  If the token is missing, expired, or invalid, immediately throw an RFC 9457 formatted `ApiError` (401 Unauthorized) to the global error handler.

## Phase 1.6: Bookmarks & Push Notifications

- [x] **7.1 Bookmarks CRUD (Protected)**
  - [x]  Apply the `requireAuth` middleware to all routes in `src/routes/bookmarks.ts`.
  - [x]  Implement `GET /v1/bookmarks`: Fetch bookmarks using Prisma where `userId === req.user.id`. Support pagination (cursor/limit) and `type` filtering.
  - [x]  Implement `POST /v1/bookmarks`: Validate the body using Zod (`type`, `title`, `url`, `thumbnailUrl`, `metadata`). Force the `userId` to be `req.user.id` (do NOT accept a user ID from the client body).
  - [x]  Implement `DELETE /v1/bookmarks/:id`: Ensure the bookmark being deleted actually belongs to `req.user.id` before executing the Prisma delete operation.

- [x] **7.2 Expo Push Service**
  - [x]  Install `expo-server-sdk`.
  - [x]  Implement `src/services/expoPush.ts` to initialize the SDK (using `EXPO_ACCESS_TOKEN` from config if applicable).
  - [x]  Create helper functions to format and send push notification payloads.

- [x] **7.3 Push Token Management (Protected)**
  - [x]  Apply the `requireAuth` middleware to all routes in `src/routes/notifications.ts`.
  - [x]  Implement `POST /v1/notifications/token`: Validate body with Zod (`token`, `platform`, `deviceName`). Upsert the `PushToken` in Prisma, firmly linking it to `req.user.id`.
  - [x]  Implement `PATCH /v1/notifications/preferences`: Update the JSON preferences string for the specific token associated with `req.user.id`.
  - [x]  Implement `DELETE /v1/notifications/token/:tokenId`: Ensure the token belongs to `req.user.id` before deleting it from the database (e.g., when a user logs out of a specific device).

## Phase 1.7: Cache Warming & Background Polling

- [x] **8.1 Install Cache Library**
  - [x]  Install `node-cache`.

- [x] **8.2 Create Cache Utility (`src/utils/cache.ts`)**
  - [x]  Initialize `node-cache` with a standard TTL of 24 hours (86400 seconds). This keeps the RAM clean of obscure, old articles while keeping the main feed incredibly fast.

- [x] **8.3 Implement Lazy Loading (`src/services/wordpress.ts`)**
  - [x]  Wrap the main fetch functions (like `fetchFeed`) in a Cache-Aside pattern.
  - [x]  If `cache.get(key)` exists, return it. If not, fetch from WP, `cache.set(key, data)`, and return.

- [x] **8.4 Implement Cache Warming (Server Startup)**
  - [x]  In `src/app.ts` (or a dedicated initialization file), call `fetchFeed(1, 10)` immediately when the server starts. This "warms" the cache so the very first user gets an instant response.

- [x] **8.5 Implement Background Polling (`src/services/polling.ts`)**
  - [x]  Create a `setInterval` function that runs every 5 minutes.
  - [x]  The function should silently fetch the latest page of articles from WordPress.
  - [x]  Compare the `modified` timestamps of the fetched articles against the cached feed.
  - [x]  If an article is new OR its `modified` timestamp is newer (e.g., an editor fixed a typo), overwrite the `wp_feed_page_1` cache key with the fresh data.

## Phase 1.8: Final MVP Validation

- [ ] **9.1 End- [ ] to- [ ] End Integration Test**
  - [ ]  Simulate: Login - [ ] > Get Feed - [ ] > Bookmark Article - [ ] > Verify Bookmark exists in DB.

- [ ] **9.2 API Documentation Check**
  - [ ]  Ensure all Phase 1 endpoints match the 8.0 API Reference in the spec exactly.

  What are the next steps needed to host it onto a VPS?
To transition this from a local development environment to a live VPS, you'll need to do the following:
1. Server Provisioning: SSH into your VPS, install Node.js (v18+), npm, and pm2 (a process manager to keep the app running forever).
2. Database Preparation: It currently uses SQLite (dev.db). While you can use SQLite on a VPS by persisting the file, it is highly recommended to migrate your Prisma schema to PostgreSQL or MySQL for production concurrency.
3. Deploy Codebase: Clone the repo to the VPS, run npm install, and generate the production build using npm run build.
4. Environment Variables: Create a production .env file containing your live DATABASE_URL, JWT_SECRET, WORKOS_API_KEY, WORKOS_CLIENT_ID, and your real WORDPRESS_API_BASE_URL.
5. Run Migrations: Run npx prisma migrate deploy to initialize your production database schema.
6. Start the App: Start the compiled server using pm2 start dist/server.js.
7. Nginx & HTTPS (Certbot): Install Nginx and configure it as a reverse proxy to forward external traffic (ports 80/443) to your Node application's internal port. Finally, run Let's Encrypt (certbot) to automatically generate and attach an SSL certificate to your Nginx configuration. This will give you the complete HTTPS protection you require.