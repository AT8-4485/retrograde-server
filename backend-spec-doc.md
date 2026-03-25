# The Retrograde News — Backend, Middleware

**Last Updated:** February 2026

*Read this entire specification before writing a single line of code. This document serves as the single source of truth for all AI coding agents implementing the middleware.*

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project File Structure](#3-project-file-structure)
4. [Data Models](#4-data-models)
5. [Phase 1 — MVP](#5-phase-1--mvp)
6. [Phase 2 — Stretch Goals](#6-phase-2--stretch-goals)
7. [API Reference](#8-api-reference)
8. [Error Handling Standards](#9-error-handling-standards)
9. [Non-Functional Requirements](#10-non-functional-requirements)
10. [Environment Variables](#11-environment-variables)
11. [Glossary](#12-glossary)
12. [Agent Instructions & Constraints](#13-agent-instructions--constraints)

---

## 1. Product Overview

The Retrograde News middleware service is an application server that acts as a single gateway between the mobile client and external data sources. Its primary architectural purpose is to intercept mobile client requests, strip redundant web metadata, and return optimized JSON. The app should be fully usable without an account, and the core reading experience is completely anonymous.

**Core Features:**
*   Authenticates users via a passwordless email one-time-password (OTP) flow.
*   Manages per-user bookmarks.
*   Delivers push notifications via Expo Push.
*   Hosts daily interactive games with social leaderboards and streaks.

## 2. Tech Stack

*All backend technology decisions below are fixed. Do not substitute libraries.*

| Layer | Technology | Notes/Constraints |
| :--- | :--- | :--- |
| **API Gateway** | Node.js + Express | Acts as the intermediary layer and data transformation service. |
| **Primary Content Store** | WordPress CMS + MySQL | Acts as the single source of truth for all journalistic content. Remains untouched by mobile devs to preserve the editorial team's workflow. |
| **Authentication** | WorkOS | Secures the backend for user accounts (Magic Auth OTP / JWT). Handles the passwordless OTP email flow. |
| **Notifications** | Expo Notifications | The Expo Push Service abstracts over APNs and FCM, allowing the Node.js server to send a single API request rather than managing platform-specific integrations. |
| **Media Delivery** | Cloudflare CDN | Caches and serves high-resolution article thumbnails and assets to reduce latency and offload bandwidth from the primary WordPress VPS. |
| **User Info** | SQLite | Stores user data so they can be retrieved. |
| **Hosting** | VPS | Deploys the Node.js/Express server on VPS to host it. |

## 3. Project File Structure

Create files in this exact structure.

```text
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── feed.ts
│   │   ├── bookmarks.ts
│   │   ├── games.ts
│   │   ├── notifications.ts
│   │   └── proxy.ts
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.ts          # Validates OTP tokens
│   │   ├── errorHandler.ts  # Formats to RFC 9457
│   │   └── rateLimiter.ts   
│   ├── services/
│   │   ├── wordpress.ts     # Queries WP API and strips metadata
│   │   ├── atproto.ts       # Interfaces with the PDS
│   │   └── expoPush.ts      # Handles Expo Push notifications
│   ├── utils/
│   │   ├── config.ts        
│   │   └── logger.ts        
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## 4. Data Models

While journalistic content is stored in WordPress, user-specific data must be stored in the middleware's dedicated database - SQLite.

*   **User**: Stores `id` (UUIDv7), `email`, `displayName`, `avatarUrl`, `bio`, and `createdAt`.
*   **Bookmark**: Tied to a user account. Stores `id`, `type` (article, game, post), `title`, `url`, `thumbnailUrl`, and associated metadata.
*   **GameResult**: Stores `challengeId`, `userId` (nullable for anonymous play), `score`, `durationMs`, `rank`, and `streak`.
*   **PushToken**: Links an Expo Push token to a user profile along with their notification preferences (e.g., breaking news, quiet hours).

## 5. Phase 1 — MVP

**Goal:** Deliver core reading, user authentication, and data transformation proxying.

*   **WP Proxy:** Build the `wordpress.ts` service that queries the WordPress API, strips metadata, and serves JSON to the client.
*   **Authentication:** Implement `POST /v1/auth/request-otp` and `POST /v1/auth/verify-otp` for passwordless login. If an account does not exist, create one automatically on the first successful verification.
*   **Bookmarks:** Implement CRUD operations for user bookmarks. Bookmarks require authentication.
*   **Push Notifications:** Build endpoints to register/unregister tokens and manage preferences. Integrate with Expo Push Service.
*   **Database:** User database setup, schema.

## 6. Phase 2 — Stretch Goals

**Goal:** Implement social and retention features.

*   **Daily Games API:** Implement game fetching and result submissions. Anyone can play games and submit results anonymously. Authentication is only required to appear on leaderboards and track streaks.
*   **External Service Proxies:** Create proxy endpoints for third-party APIs (Nebula Labs) so that private API keys never ship to the client.
*   **User Analytics:** Utilize PostHog to retrieve user analytics such as - bookmark rate, article views + screen time, article scroll depth, game-to-article funnel, etc.
*   **Editorial Micro-blog:** Read-only micro-blog feed VIA Bluesky.

## 8. API Reference

All endpoints live under the versioned base path: `https://api.retrogradenews.app/v1`.

*   **Transport:** HTTPS only.
*   **Content-Type:** `application/json`.
*   **Auth:** `Authorization: Bearer <access_token>` when required.
*   **IDs & Timestamps:** UUIDv7 strings and ISO 8601 timestamps.
*   **Pagination Envelope:** List endpoints return a standard envelope containing `data` (array), `cursor` (string or null), and `hasMore` (boolean).

### 8.1 Authentication Routes (Passwordless OTP)

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **Request OTP** | `POST /auth/request-otp` | **Auth:** Public.<br>**Body:** `{ "email": "string" }`.<br>**Success (200):** Returns `{ "message": "...", "expiresInSeconds": 300 }`. Identical response whether email exists or not to prevent enumeration. |
| **Verify OTP** | `POST /auth/verify-otp` | **Auth:** Public.<br>**Body:** `{ "email": "string", "code": "string" }`.<br>**Success (200):** Returns `{ accessToken, refreshToken, expiresIn, user }`. Creates an account automatically on first successful verification if one does not exist. |
| **Refresh Tokens** | `POST /auth/refresh` | **Auth:** Public.<br>**Body:** `{ "refreshToken": "string" }`.<br>**Success (200):** Returns new tokens and user object. |
| **Log Out** | `POST /auth/logout` | **Auth:** Public.<br>**Body:** `{ "refreshToken": "string" }`.<br>**Success (204):** No content. |

### 8.2 User Profile Routes

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **Get Current User** | `GET /me` | **Auth:** Required.<br>**Success (200):** Returns the user object including stats (`gamesPlayed`, `currentStreak`, `bookmarksCount`). |
| **Update Profile** | `PATCH /me` | **Auth:** Required.<br>**Body:** `{ "displayName"?: "string", "bio"?: "string", "avatarUrl"?: "string" }`.<br>**Success (200):** Returns updated user object. |
| **Delete Account** | `DELETE /me` | **Auth:** Required.<br>**Success (204):** Queues account deletion; purges data within 30 days. |

### 8.3 Daily Games Routes

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **List Games** | `GET /games` | **Auth:** Public.<br>**Success (200):** Returns array of available games with `availableAt` and `expiresAt`. |
| **Get Today's Challenge** | `GET /games/:gameId/today` | **Auth:** Public.<br>**Success (200):** Returns `{ challengeId, gameId, date, payload, userAttempt }`. If authenticated and played, `userAttempt` contains previous results. |
| **Submit Result** | `POST /games/:gameId/today/results` | **Auth:** Public (Auth required only to persist to leaderboard).<br>**Body:** `{ "challengeId": "string", "score": number, "maxScore": number, "durationMs": number, "answers": array }`.<br>**Success (201):** Returns `{ resultId, rank, percentile, streak, isPersonalBest }`. If unauthenticated, `rank`, `streak`, and `isPersonalBest` are null. |
| **Get Leaderboard** | `GET /games/:gameId/leaderboard` | **Auth:** Public (Auth required only to see `userEntry` in response).<br>**Query Params:** `period` (daily, weekly, alltime), `date`.<br>**Success (200):** Returns paginated data array of top scores and a `userEntry` object for the requesting user. |

### 8.4 AT Protocol Feed Routes

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **Get Feed** | `GET /feed` | **Auth:** Public.<br>**Query Params:** `cursor`, `limit`.<br>**Success (200):** Returns combined chronological feed of editorial staff posts. Proxies the PDS. |
| **Get Authors** | `GET /feed/authors` | **Auth:** Public.<br>**Success (200):** Returns list of editorial staff whose posts appear in the feed. |

### 8.5 Bookmarks Routes

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **List Bookmarks** | `GET /bookmarks` | **Auth:** Required.<br>**Query Params:** `type` (article, game, post, all), `cursor`, `limit`.<br>**Success (200):** Returns paginated array of bookmarks. |
| **Create Bookmark** | `POST /bookmarks` | **Auth:** Required.<br>**Body:** `{ "type": "string", "title": "string", "url": "string", "thumbnailUrl": "string", "metadata": object }`.<br>**Success (201):** Returns full bookmark object. |
| **Delete Bookmark** | `DELETE /bookmarks/:bookmarkId` | **Auth:** Required.<br>**Success (204):** No content. |

### 8.6 Push Notifications Routes

| Endpoint | Method / Path | Details |
| :--- | :--- | :--- |
| **Register Token** | `POST /notifications/token` | **Auth:** Required.<br>**Body:** `{ "token": "string", "platform": "string", "deviceName": "string" }`.<br>**Success (201):** Returns created token record. |
| **Unregister Token** | `DELETE /notifications/token/:tokenId` | **Auth:** Required.<br>**Success (204):** No content. |
| **Get Preferences** | `GET /notifications/preferences` | **Auth:** Required.<br>**Success (200):** Returns `{ breakingNews, dailyGameReminder, weeklyDigest, editorialPosts, quietHours }`. |
| **Update Preferences** | `PATCH /notifications/preferences` | **Auth:** Required.<br>**Body:** Partial preferences object.<br>**Success (200):** Returns updated preferences object. |

## 9. Error Handling Standards

All API errors must adhere to the RFC 9457 Problem Details format.

**Standard Error Shape:**
```json
{
  "type": "https://api.retrogradenews.app/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Bookmark bk_01J5... does not exist.",
  "instance": "/v1/bookmarks/bk_01J5..."
}
```

## 10. Non-Functional Requirements

*   **Security:** Enforce HTTPS only. No passwords are ever stored.
*   **Rate Limiting:** Unauthenticated endpoints: 30 requests per minute. Authenticated endpoints: 120 requests per minute. OTP requests: 5 per email per 15 minutes. Rate-limited responses must return `429 Too Many Requests` with a `Retry-After` header.
*   **Versioning:** Deprecated endpoints will return a `Sunset` header for at least 90 days before removal.

## 11. Environment Variables

Config must be validated at startup; the app should fail fast if required variables are missing.

```env
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORDPRESS_API_BASE_URL=
DATABASE_URL= # For the middleware's user/bookmark DB
JWT_SECRET=
EXPO_ACCESS_TOKEN=
```

## 12. Glossary

*   **Middleware:** The intermediary Node.js server that transforms data between the WordPress single source of truth and the mobile client.
*   **OTP:** One-Time Password, used for the passwordless authentication flow.
*   **PDS (Personal Data Server):** The AT Protocol server hosting accounts for editorial staff.

## 13. Agent Instructions & Constraints

*   **Scope Isolation:** You are building the Node.js/Express middleware application. Do not generate React Native UI components.
*   **Auth Enforcement:** Ensure endpoints for the news feed, games, micro-blog remain accessible without authentication.
*   **Error Compliance:** Every single error path must return a strictly formatted RFC 9457 JSON response. Do not fallback to standard Express HTML error pages.
