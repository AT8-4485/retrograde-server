# Backend Testing Guide

This directory contains the unit and integration tests for the Retrograde News Middleware API. We use [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest) for executing our test suites natively in TypeScript via `ts-jest`.

## 🚀 Running Tests

To run all tests:
```bash
npm run test
```

To run a specific test file:
```bash
npx jest tests/services/user.test.ts
```

To run tests in watch mode (ideal for development):
```bash
npx jest --watch
```

## 📂 Test Structure

- `tests/setup.ts`: Global setup file for Jest. This connects to the test database and clears all tables before *each* test run to ensure strict isolation.
- `tests/config.test.ts`: Verifies that the app fails securely if required environment variables are missing or malformed (using Zod).
- `tests/errorHandler.test.ts`: Uses Supertest to verify that our global Express error handler strictly formats all errors (including validation and unhandled exceptions) to the RFC 9457 JSON "Problem Details" standard.
- `tests/rateLimiter.test.ts`: Uses Supertest to blast mock endpoints and verify that the `publicLimiter` and `otpLimiter` return `429 Too Many Requests` when quotas are exceeded.
- `tests/services/user.test.ts`: Tests Prisma database operations, schema integrity, cascade deletes, and verifies the automatic generation of UUIDv7 keys via our Prisma Extension.
- `tests/__mocks__/`: Contains module mocks (e.g., `uuid.ts`) to resolve CommonJS/ESM module resolution issues specific to the Jest environment.

## 🗄️ Test Database

The test suite runs against a separate physical SQLite database file (`test.db`). 

- The `.env.test` file automatically overrides your standard `.env` variables during test execution.
- If you change `prisma/schema.prisma`, you must push the changes to the test database manually before running tests:
  ```bash
  DATABASE_URL="file:./test.db" npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
  ```

## 🛠️ Adding New Tests

1.  Place new test files anywhere inside the `tests/` directory.
2.  Suffix the file name with `.test.ts` (e.g., `tests/routes/feed.test.ts`).
3.  For testing Express routes, import your un-mounted `app` instance (or mount the specific router on a dummy `express()` app) and pass it to `supertest(app)`.
