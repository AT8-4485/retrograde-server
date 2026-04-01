# Retrograde News Backend

The backend middleware service for the Retrograde News mobile application. This service acts as an API Gateway, proxying and transforming data from WordPress, handling passwordless authentication via WorkOS, and managing user data (bookmarks, push tokens, game results) in a PostgreSQL database.

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (for local database)

## Local Development Setup

### 1. Environment Variables
Create a `.env` file based on the example:
```bash
cp .env.example .env
```
Fill in your `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, and `JWT_SECRET` keys.

### 2. Start the Database
The project requires a PostgreSQL database to run locally. We use Docker Compose to spin up a local instance pre-configured with a `retrograde_dev` and a `retrograde_test` database.

```bash
npm run db:up
```

### 3. Install Dependencies & Migrate
Install the required packages and run the initial Prisma migration to scaffold your database schema.

```bash
npm install
npm run db:migrate
```

### 4. Start the Server
Start the development server with hot-reloading:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Testing

The test suite automatically pushes the schema to the isolated `retrograde_test` database defined in `.envtest` before running.

Ensure your Docker container is running (`npm run db:up`), then simply execute:

```bash
npm run test
```

## Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts the TS-Node development server. |
| `npm run build` | Compiles the TypeScript code to `./dist/`. |
| `npm run start` | Runs the compiled application. |
| `npm run db:up` | Spins up the local PostgreSQL Docker container. |
| `npm run db:down` | Tears down the local PostgreSQL Docker container. |
| `npm run db:migrate` | Generates a new migration and updates the dev database. |
| `npm run test` | Runs the Jest test suite against the test database. |
