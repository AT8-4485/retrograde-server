# Retrograde API Documentation

**Base URL:** `https://retrograde-server-production.up.railway.app`

All endpoints are prefixed with `/v1`.

## Authentication
Authentication is required for certain routes. When required, include the following header in your request:
`Authorization: Bearer <accessToken>`

---

## 1. Auth Endpoints

### 1.1 Request OTP (WorkOS Magic Auth)
Sends a one-time passcode to the user's email address.

- **Method:** `POST`
- **Endpoint:** `/v1/auth/request-otp`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "string (required, valid email)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/auth/request-otp \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com"}'
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "If the email exists, a one-time code has been sent.",
    "expiresInSeconds": 600
  }
  ```

### 1.2 Verify OTP
Verifies the OTP sent to the user's email and issues local access and refresh tokens.

- **Method:** `POST`
- **Endpoint:** `/v1/auth/verify-otp`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "string (required, valid email)",
    "code": "string (required)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "code": "123456"}'
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "string",
      "email": "string",
      "displayName": "string | null",
      "avatarUrl": "string | null",
      "bio": "string | null",
      "createdAt": "date-string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

### 1.3 Refresh Tokens
Get a new access token using a valid refresh token.

- **Method:** `POST`
- **Endpoint:** `/v1/auth/refresh`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "refreshToken": "string (required)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken": "your_refresh_token_here"}'
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "string"
  }
  ```

### 1.4 Logout
Invalidate a session by providing the refresh token.

- **Method:** `POST`
- **Endpoint:** `/v1/auth/logout`
- **Auth Required:** No (Rate limited)
- **Body:**
  ```json
  {
    "refreshToken": "string (required)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/auth/logout \
    -H "Content-Type: application/json" \
    -d '{"refreshToken": "your_refresh_token_here"}'
  ```
- **Response (204 No Content)**

---

## 2. Feed Endpoints

### 2.1 Get Main Feed
Fetch a paginated list of articles (excluding "issue" categories).

- **Method:** `GET`
- **Endpoint:** `/v1/feed`
- **Auth Required:** No
- **Query Parameters:**
  - `cursor` (number, optional, default: 1): The page number.
  - `limit` (number, optional, default: 10, max: 50): Articles per page.
- **Example cURL:**
  ```bash
  curl -X GET "https://retrograde-server-production.up.railway.app/v1/feed?cursor=1&limit=10"
  ```
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "string",
        "title": "string",
        "excerpt": "string",
        "content": "string",
        "thumbnailUrl": "string | null",
        "authorName": "string",
        "publishedAt": "string",
        "modifiedAt": "string",
        "categories": ["string"]
      }
    ],
    "cursor": "string | null",
    "hasMore": boolean
  }
  ```

### 2.2 Get Feed by Category
Fetch a paginated list of articles filtered by WordPress category IDs.

- **Method:** `GET`
- **Endpoint:** `/v1/feed/category`
- **Auth Required:** No
- **Query Parameters:**
  - `cursor` (number, optional, default: 1)
  - `limit` (number, optional, default: 10, max: 50)
  - `categories` (string, required): Comma-separated list of category IDs (e.g., `12,34`). Valid categories are: 
    - `1363` (News)
    - `1469` (Breaking News)
    - `1364` (Opinion)
    - `1454` (Opinion Sub)
    - `1365` (Life & Arts)
    - `1366` (Comics)
- **Example cURL:**
  ```bash
  curl -X GET "https://retrograde-server-production.up.railway.app/v1/feed/category?categories=1363,1469&cursor=1&limit=10"
  ```
- **Response (200 OK):** Same structure as `Get Main Feed`.

### 2.3 Get Issues
Fetch a paginated list of "Issues" (Category ID 1407).

- **Method:** `GET`
- **Endpoint:** `/v1/feed/issues`
- **Auth Required:** No
- **Query Parameters:**
  - `cursor` (number, optional, default: 1)
  - `limit` (number, optional, default: 10, max: 50)
- **Example cURL:**
  ```bash
  curl -X GET "https://retrograde-server-production.up.railway.app/v1/feed/issues?cursor=1&limit=10"
  ```
- **Response (200 OK):** Same structure as `Get Main Feed`.

### 2.4 Get Latest Issue
Fetch the most recent issue and all articles published on the same day as that issue.

- **Method:** `GET`
- **Endpoint:** `/v1/feed/issues/latest`
- **Auth Required:** No
- **Example cURL:**
  ```bash
  curl -X GET "https://retrograde-server-production.up.railway.app/v1/feed/issues/latest"
  ```
- **Response (200 OK):**
  ```json
  {
    "issue": {
        "id": "string",
        "title": "string",
        "excerpt": "string"
    },
    "articles": [
       // Array of LeanArticle objects
    ]
  }
  ```

---

## 3. Bookmarks Endpoints

### 3.1 Get Bookmarks
Fetch paginated bookmarks for the authenticated user.

- **Method:** `GET`
- **Endpoint:** `/v1/bookmarks`
- **Auth Required:** Yes
- **Query Parameters:**
  - `cursor` (string, optional)
  - `limit` (number, optional, default: 10, max: 50)
  - `type` (string, optional): Filter by type (e.g., "article", "game").
- **Example cURL:**
  ```bash
  curl -X GET "https://retrograde-server-production.up.railway.app/v1/bookmarks?limit=10" \
    -H "Authorization: Bearer your_access_token_here"
  ```
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "string",
        "type": "string",
        "title": "string",
        "url": "string",
        "thumbnailUrl": "string | null",
        "metadata": "string | null",
        "createdAt": "date-string"
      }
    ],
    "cursor": "string | null",
    "hasMore": boolean
  }
  ```

### 3.2 Create Bookmark
Save a new bookmark.

- **Method:** `POST`
- **Endpoint:** `/v1/bookmarks`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "type": "string (required)",
    "title": "string (required)",
    "url": "string (required, valid URL)",
    "thumbnailUrl": "string (optional, valid URL or empty string)",
    "metadata": "string (optional, JSON string)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/bookmarks \
    -H "Authorization: Bearer your_access_token_here" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "article",
      "title": "Breaking News Article",
      "url": "https://retrogradenews.app/article/123",
      "thumbnailUrl": "https://retrogradenews.app/images/123.jpg",
      "metadata": "{\"author\":\"Jane Doe\"}"
    }'
  ```
- **Response (201 Created):** Returns the created bookmark object.

### 3.3 Delete Bookmark
Remove a saved bookmark.

- **Method:** `DELETE`
- **Endpoint:** `/v1/bookmarks/:id`
- **Auth Required:** Yes
- **URL Parameters:**
  - `id`: The ID of the bookmark to delete.
- **Example cURL:**
  ```bash
  curl -X DELETE https://retrograde-server-production.up.railway.app/v1/bookmarks/12345 \
    -H "Authorization: Bearer your_access_token_here"
  ```
- **Response (204 No Content):** Empty body on success.

---

## 4. Notifications Endpoints

### 4.1 Register Push Token
Register a new anonymous device push token (upserts if token already exists).

- **Method:** `POST`
- **Endpoint:** `/v1/notifications/token`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "token": "string (required)",
    "platform": "ios | android (required)",
    "deviceName": "string (optional)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X POST https://retrograde-server-production.up.railway.app/v1/notifications/token \
    -H "Content-Type: application/json" \
    -d '{
      "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      "platform": "ios",
      "deviceName": "iPhone 13 Pro"
    }'
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "string",
    "token": "string",
    "platform": "ios | android",
    "deviceName": "string | null",
    "createdAt": "date-string",
    "lastSeenAt": "date-string"
  }
  ```

### 4.2 Update Token Preferences
Update notification preferences for a specific signed-in user's token.

> Preferences are future-facing for account-based notifications. Notifications V1 uses anonymous device opt-in/out via token registration and deletion.

- **Method:** `PATCH`
- **Endpoint:** `/v1/notifications/preferences`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "tokenId": "string (required)",
    "preferences": "string (required, minimum 2 characters, expected JSON string)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X PATCH https://retrograde-server-production.up.railway.app/v1/notifications/preferences \
    -H "Authorization: Bearer your_access_token_here" \
    -H "Content-Type: application/json" \
    -d '{
      "tokenId": "12345",
      "preferences": "{\"breaking_news\":true,\"daily_digest\":false}"
    }'
  ```
- **Response (200 OK):** Returns the updated token object.

### 4.3 Remove Push Token
Unregister a device push token.

- **Method:** `DELETE`
- **Endpoint:** `/v1/notifications/token`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "token": "string (required)"
  }
  ```
- **Example cURL:**
  ```bash
  curl -X DELETE https://retrograde-server-production.up.railway.app/v1/notifications/token \
    -H "Content-Type: application/json" \
    -d '{
      "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    }'
  ```
- **Response (204 No Content):** Empty body on success.
