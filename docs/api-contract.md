# Retrograde News — Backend Middleware API Contract

> **Version:** 0.1.0-draft
> **Last Updated:** 2026-02-18
> **Status:** Proposal — not yet implemented
> **Authors:** Zeke Stephens

---

Acknowledgements: This document was drafted with the assistance of generative AI tools. For questions or clarifications regarding the details, please create an issue and tag @zekestephens.

## 1 Overview

This document defines the HTTP JSON API contract between the **Retrograde News middleware service** (hereafter "the API") and the **NewsApp React Native client**. The middleware acts as a single gateway that:

- Authenticates users via a passwordless email one-time-code (OTC) flow.
- Hosts daily interactive games with social features (leaderboards, streaks).
- Serves an editorial AT Protocol (Bluesky) micro-blog feed (read-only for all users).
- Manages per-user bookmarks.
- Delivers push notifications via Expo Push / FCM / APNs.
- Collects lightweight, privacy-respecting analytics events.
- Proxies third-party services (weather, air quality, etc.) to avoid shipping API keys to the client.

> **Design principle:** The app should be fully usable without an account. Only bookmarks and personal leaderboard entries require authentication.

All endpoints live under a versioned base path:

```
https://api.retrogradenews.app/v1
```

---

## 2 Conventions

| Item | Convention |
|---|---|
| Transport | HTTPS only |
| Content-Type | `application/json` unless noted |
| Auth | `Authorization: Bearer <access_token>` (when required) |
| Timestamps | ISO 8601 (`2026-02-18T21:54:39Z`) |
| IDs | UUIDv7 strings |
| Pagination | Cursor-based (`?cursor=<opaque>&limit=25`) |
| Errors | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) Problem Details |

### Authentication Requirements

Most endpoints are **public** and do not require a logged-in user. The table below summarizes which features require authentication.

| Feature | Auth Required? | Notes |
|---|---|---|
| News feed, games, micro-blog, weather, proxy | **No** | Core reading experience is fully anonymous |
| Submit game result (no leaderboard) | **No** | Anonymous play is allowed; results are ephemeral |
| Game leaderboard entry + streaks | **Yes** | Score is persisted and attributed to user |
| Bookmarks (CRUD) | **Yes** | Bookmarks are tied to a user account |
| User profile (CRUD) | **Yes** | — |
| Push notification preferences | **Yes** | Token registered to user account |
| Analytics event submission | **No** | Associated with anonymous device ID |

### Standard Error Shape

```jsonc
{
  "type": "https://api.retrogradenews.app/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Bookmark bk_01J5... does not exist.",
  "instance": "/v1/bookmarks/bk_01J5..."
}
```

### Pagination Envelope

All list endpoints return:

```jsonc
{
  "data": [ /* items */ ],
  "cursor": "eyJpZCI6IjAxSjV...",   // null when no more pages
  "hasMore": true
}
```

---

## 3 Authentication

A passwordless flow based on email one-time codes. No passwords are ever stored.

### 3.1 Request a One-Time Code

```
POST /v1/auth/otp
```

**Request Body**

```json
{
  "email": "user@example.com"
}
```

**Response `200 OK`**

```json
{
  "message": "If this email is registered, a one-time code has been sent.",
  "expiresInSeconds": 300
}
```

> The response is intentionally identical whether the email exists or not (user enumeration prevention).

### 3.2 Verify Code & Obtain Tokens

```
POST /v1/auth/verify
```

**Request Body**

```json
{
  "email": "user@example.com",
  "code": "482901"
}
```

**Response `200 OK`**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBp...",
  "expiresIn": 3600,
  "user": {
    "id": "usr_01J5XYZABC",
    "email": "user@example.com",
    "displayName": "user",
    "avatarUrl": null,
    "createdAt": "2026-02-18T21:54:39Z"
  }
}
```

If the account does not exist, one is created automatically on first successful verification.

### 3.3 Refresh Tokens

```
POST /v1/auth/refresh
```

**Request Body**

```json
{
  "refreshToken": "dGhpcyBp..."
}
```

**Response `200 OK`** — same shape as §3.2.

### 3.4 Log Out

```
POST /v1/auth/logout
```

**Request Body**

```json
{
  "refreshToken": "dGhpcyBp..."
}
```

**Response `204 No Content`**

---

## 4 User Profile

### 4.1 Get Current User

```
GET /v1/me
```

**Response `200 OK`**

```json
{
  "id": "usr_01J5XYZABC",
  "email": "user@example.com",
  "displayName": "retro_reader",
  "avatarUrl": "https://cdn.retrogradenews.app/avatars/usr_01J5XYZABC.webp",
  "bio": "News junkie from Dallas.",
  "linkedAtProto": "did:plc:abc123",
  "stats": {
    "gamesPlayed": 42,
    "currentStreak": 7,
    "bookmarksCount": 13
  },
  "createdAt": "2026-02-18T21:54:39Z"
}
```

### 4.2 Update Profile

```
PATCH /v1/me
```

**Request Body** (all fields optional)

```json
{
  "displayName": "RetroReader",
  "bio": "News junkie from Dallas, TX.",
  "avatarUrl": "https://cdn.retrogradenews.app/avatars/usr_01J5XYZABC.webp"
}
```

**Response `200 OK`** — returns the full updated user object (same shape as §4.1).

### 4.3 Delete Account

```
DELETE /v1/me
```

**Response `204 No Content`**

Queues account deletion. All user data is purged within 30 days.

---

## 5 Daily Games

Each game is a self-contained daily challenge. The API is game-agnostic — individual game logic runs on the client; the API stores results and computes leaderboards.

> **Auth note:** Anyone can play games and submit results anonymously. Authentication is only required to appear on leaderboards and track streaks.

### 5.1 List Available Games

```
GET /v1/games
```

**Response `200 OK`**

```json
{
  "data": [
    {
      "id": "game_headlines",
      "name": "Headline Guesser",
      "description": "Guess the year a headline was published.",
      "iconUrl": "https://cdn.retrogradenews.app/games/headlines.webp",
      "availableAt": "2026-02-18T06:00:00Z",
      "expiresAt": "2026-02-19T06:00:00Z"
    },
    {
      "id": "game_connections",
      "name": "News Connections",
      "description": "Group today's stories by hidden category.",
      "iconUrl": "https://cdn.retrogradenews.app/games/connections.webp",
      "availableAt": "2026-02-18T06:00:00Z",
      "expiresAt": "2026-02-19T06:00:00Z"
    }
  ]
}
```

### 5.2 Get Today's Game Challenge

```
GET /v1/games/:gameId/today
```

**Response `200 OK`**

```json
{
  "challengeId": "ch_01J5ABC123",
  "gameId": "game_headlines",
  "date": "2026-02-18",
  "payload": {
    "_comment": "Game-specific data — shape varies per gameId",
    "headlines": [
      { "text": "Scientists Discover New Element in Deep Ocean Vents", "choices": [2019, 2022, 2024, 2026] },
      { "text": "City Council Votes to Ban Plastic Straws", "choices": [2018, 2020, 2023, 2025] }
    ]
  },
  "userAttempt": null
}
```

If an authenticated user has already submitted, `userAttempt` contains their previous result (§5.3 shape) and the client should display it instead of allowing replay. For anonymous users, replay prevention is handled client-side via local storage.

### 5.3 Submit Game Result

```
POST /v1/games/:gameId/today/results
```

> 🔓 **Public** — works without auth. If unauthenticated, `rank`, `streak`, and `isPersonalBest` are `null` and the result is not persisted to the leaderboard.

**Request Body**

```json
{
  "challengeId": "ch_01J5ABC123",
  "score": 4,
  "maxScore": 5,
  "durationMs": 32450,
  "answers": [2022, 2018]
}
```

**Response `201 Created`**

```json
{
  "resultId": "res_01J5DEF456",
  "rank": 12,
  "percentile": 88.5,
  "streak": 8,
  "isPersonalBest": true
}
```

### 5.4 Leaderboard

> 🔒 **Auth required** to have a `userEntry`; the leaderboard itself is publicly viewable.

```
GET /v1/games/:gameId/leaderboard?period=daily&date=2026-02-18&limit=25
```

| Param | Values | Default |
|---|---|---|
| `period` | `daily`, `weekly`, `alltime` | `daily` |
| `date` | ISO date | today |

**Response `200 OK`**

```json
{
  "data": [
    {
      "rank": 1,
      "user": { "id": "usr_01J5...", "displayName": "SpeedReader", "avatarUrl": "..." },
      "score": 5,
      "durationMs": 8120,
      "streak": 31
    }
  ],
  "userEntry": {
    "rank": 12,
    "score": 4,
    "durationMs": 32450,
    "streak": 8
  },
  "cursor": null,
  "hasMore": false
}
```

---

## 6 AT Protocol Micro-Blog Feed

A **read-only**, publicly accessible editorial micro-blog powered by AT Protocol.

### Architecture

Retrograde News operates its own **PDS (Personal Data Server)** that hosts accounts for all editorial staff and partner journalists. The middleware queries the PDS directly via its native AT Proto HTTP API (`com.atproto.repo.listRecords`, `app.bsky.feed.getAuthorFeed`, etc.) to aggregate recent posts across all staff accounts into a single chronological feed.

Because these are standard AT Proto accounts:

- **In-app readers** see the feed without needing a Bluesky account — the middleware fetches and normalizes the data.
- **Bluesky users** can discover and follow the journalists, reply, like, and repost through the regular Bluesky app — interop is built into the protocol.

The middleware's role is simply to **proxy and merge** multiple author feeds from the PDS into one combined timeline for the client.

> 🔓 **Public** — no authentication required.

### 6.1 Get Feed

```
GET /v1/feed?cursor=...&limit=25
```

**Response `200 OK`**

```json
{
  "data": [
    {
      "uri": "at://did:plc:abc123/app.bsky.feed.post/3k...",
      "cid": "bafyrei...",
      "author": {
        "did": "did:plc:abc123",
        "handle": "reporter.bsky.social",
        "displayName": "Jane Reporter",
        "avatarUrl": "https://cdn.bsky.app/...",
        "role": "editor"
      },
      "text": "Breaking: City approves new transit expansion plan for 2027.",
      "embed": null,
      "likeCount": 42,
      "repostCount": 7,
      "replyCount": 3,
      "indexedAt": "2026-02-18T21:50:00Z"
    }
  ],
  "cursor": "eyJpZCI6...",
  "hasMore": true
}
```

### 6.2 Get Staff Authors

Returns the list of editorial staff whose posts appear in the feed.

```
GET /v1/feed/authors
```

**Response `200 OK`**

```json
{
  "data": [
    {
      "did": "did:plc:abc123",
      "handle": "reporter.bsky.social",
      "displayName": "Jane Reporter",
      "avatarUrl": "https://cdn.bsky.app/...",
      "role": "editor",
      "bio": "Senior editor covering city government."
    }
  ]
}
```

---

## 7 Bookmarks

> 🔒 **Auth required** for all bookmark endpoints.

Allows authenticated users to save articles, game results, and feed posts for later reference.

### 7.1 List Bookmarks

```
GET /v1/bookmarks?type=article&cursor=...&limit=25
```

| Param | Values | Default |
|---|---|---|
| `type` | `article`, `game`, `post`, `all` | `all` |

**Response `200 OK`**

```json
{
  "data": [
    {
      "id": "bk_01J5GHI789",
      "type": "article",
      "title": "City Approves Transit Expansion",
      "url": "https://example.com/transit-expansion",
      "thumbnailUrl": "https://cdn.retrogradenews.app/thumbs/...",
      "savedAt": "2026-02-18T20:00:00Z",
      "metadata": {
        "source": "Example News",
        "publishedAt": "2026-02-18T18:00:00Z"
      }
    }
  ],
  "cursor": "eyJpZCI6...",
  "hasMore": false
}
```

### 7.2 Create Bookmark

```
POST /v1/bookmarks
```

**Request Body**

```json
{
  "type": "article",
  "title": "City Approves Transit Expansion",
  "url": "https://example.com/transit-expansion",
  "thumbnailUrl": "https://cdn.retrogradenews.app/thumbs/...",
  "metadata": {
    "source": "Example News",
    "publishedAt": "2026-02-18T18:00:00Z"
  }
}
```

**Response `201 Created`** — returns full bookmark object (same shape as list item).

### 7.3 Delete Bookmark

```
DELETE /v1/bookmarks/:bookmarkId
```

**Response `204 No Content`**

---

## 8 Analytics

Lightweight, privacy-respecting event collection. No PII is stored in events; all are associated with an anonymous device fingerprint plus an optional user ID.

### 8.1 Submit Events (Batch)

```
POST /v1/analytics/events
```

**Request Body**

```json
{
  "deviceId": "dev_A1B2C3D4",
  "events": [
    {
      "name": "screen_view",
      "timestamp": "2026-02-18T21:50:00Z",
      "properties": {
        "screen": "HomeScreen",
        "sessionDurationMs": 45000
      }
    },
    {
      "name": "article_read",
      "timestamp": "2026-02-18T21:51:30Z",
      "properties": {
        "articleUrl": "https://example.com/transit-expansion",
        "readDurationMs": 12000,
        "scrollDepthPct": 85
      }
    }
  ]
}
```

**Response `202 Accepted`**

```json
{
  "accepted": 2,
  "dropped": 0
}
```

---

## 9 External Service Proxies

The middleware proxies select third-party APIs so that private API keys never ship to the client. All proxy endpoints live under `/v1/proxy/`.

In the future, this layer will integrate with **Nebula Labs APIs** to provide campus data. Specific endpoints and response schemas are **TBD** pending coordination with the Nebula Labs team.

> [!NOTE]
> **WordPress REST API (`wp-json`)** is consumed **directly** by the client and is intentionally excluded from this proxy layer. The WordPress API is publicly accessible with no private keys, so proxying it would add latency and middleware complexity with no security benefit.

---

## 10 Push Notifications

The middleware dispatches push notifications via **Expo Push Notifications**, which fans out to APNs (iOS) and FCM (Android) under the hood.

> 🔒 **Auth required** — push tokens are associated with a user account so preferences roam across devices.

### 10.1 Register Push Token

```
POST /v1/notifications/token
```

**Request Body**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceName": "Zeke's iPhone"
}
```

**Response `201 Created`**

```json
{
  "id": "pt_01J5ABC123",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "createdAt": "2026-02-18T22:00:00Z"
}
```

### 10.2 Unregister Push Token

```
DELETE /v1/notifications/token/:tokenId
```

**Response `204 No Content`**

### 10.3 Get Notification Preferences

```
GET /v1/notifications/preferences
```

**Response `200 OK`**

```json
{
  "breakingNews": true,
  "dailyGameReminder": true,
  "weeklyDigest": false,
  "editorialPosts": true,
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00",
    "timezone": "America/Chicago"
  }
}
```

### 10.4 Update Notification Preferences

```
PATCH /v1/notifications/preferences
```

**Request Body** (all fields optional)

```json
{
  "breakingNews": true,
  "dailyGameReminder": false,
  "editorialPosts": true,
  "quietHours": {
    "enabled": true,
    "startTime": "23:00",
    "endTime": "08:00",
    "timezone": "America/Chicago"
  }
}
```

**Response `200 OK`** — returns the full updated preferences object (same shape as §10.3).

### 10.5 Notification Categories

The following push notification types may be dispatched by the server:

| Category | Trigger | Default |
|---|---|---|
| `breaking_news` | Editorial staff flags a story as breaking | On |
| `daily_game` | New daily game challenge available (6 AM local) | On |
| `weekly_digest` | Weekly summary of top stories (Sunday 9 AM local) | Off |
| `editorial_post` | New post from a followed staff author | On |
| `streak_warning` | User's game streak will expire if they don't play today | On |

---

## 11 Rate Limiting & Quotas

| Scope | Limit | Window |
|---|---|---|
| Unauthenticated | 30 requests | 1 minute |
| Authenticated | 120 requests | 1 minute |
| OTP requests | 5 per email | 15 minutes |
| Analytics batch | 100 events | per request |

Rate-limited responses return `429 Too Many Requests` with a `Retry-After` header.

---

## 12 Versioning & Deprecation

- The API is versioned via path prefix (`/v1`).
- Deprecated endpoints will return a `Sunset` header ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594.html)) for at least **90 days** before removal.
- Breaking changes will only ship in a new major version (`/v2`).

---

## 13 Security Considerations

| Concern | Approach |
|---|---|
| Transport | TLS 1.3, HSTS |
| Token storage | Secure Keychain (iOS) / EncryptedSharedPreferences (Android) via `expo-secure-store` |
| OTP brute force | Rate limit + exponential backoff + code expiry (5 min) |
| Proxy abuse | Per-device rate limit |
| Push token validation | Expo Push validates tokens server-side; stale tokens are pruned on delivery failure |
| Data at rest | AES-256 encryption for PII |
| CORS | Restricted to known client origins |

---

## 14 Open Questions

> These items are flagged for team discussion before implementation begins.

- [ ] **Image uploads** — Presigned S3 URLs vs. direct multipart upload to the middleware for user avatars?
- [ ] **Offline sync** — Should bookmarks and game progress sync via a CRDT-based conflict resolution strategy?
- [ ] **Rich embeds** — Should the feed endpoint resolve link-card embeds server-side, or let the client fetch Open Graph metadata?
- [ ] **Multi-tenancy** — Is there a future where multiple "news apps" share this middleware?

---

*This document is a living specification. All endpoints are subject to change prior to v1 launch.*
