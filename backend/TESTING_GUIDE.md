# Retrograde Backend Testing Guide

This document provides step-by-step instructions to test all functional areas of the Retrograde backend API.

## Prerequisites

- Backend server running locally or on Railway
- Valid JWT access token (obtain via `/v1/auth/verify-otp`)
- Your user account registered in the system

---

## 1. Authentication

### 1.1 Request OTP
```bash
curl -X POST "http://localhost:3000/v1/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### 1.2 Verify OTP
```bash
curl -X POST "http://localhost:3000/v1/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "code": "123456"}'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "your-email@example.com"
  }
}
```

---

## 2. News Feed

### 2.1 Get Main Feed
```bash
curl -X GET "http://localhost:3000/v1/feed?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2.2 Get Feed by Category
```bash
# NEWS = 1363, OPINION = 1364, LIFE_ARTS = 1365, COMICS = 1366
curl -X GET "http://localhost:3000/v1/feed/category?categories=1363,1364&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2.3 Get Issues Archive
```bash
curl -X GET "http://localhost:3000/v1/feed/issues?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2.4 Get Latest Issue with Articles
```bash
curl -X GET "http://localhost:3000/v1/feed/issues/latest" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Bookmarks

### 3.1 Get Bookmarks
```bash
curl -X GET "http://localhost:3000/v1/bookmarks?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3.2 Create Bookmark
```bash
curl -X POST "http://localhost:3000/v1/bookmarks" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "article",
    "title": "Test Article Title",
    "url": "https://example.com/article/123",
    "thumbnailUrl": "https://example.com/image.jpg",
    "metadata": "{\"author\": \"Test Author\"}"
  }'
```

### 3.3 Delete Bookmark
```bash
curl -X DELETE "http://localhost:3000/v1/bookmarks/BOOKMARK_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Push Notifications

### 4.1 Register Device Token
```bash
curl -X POST "http://localhost:3000/v1/notifications/token" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[XXXXXXXXXXXXXXXXXXXXXX]",
    "platform": "ios",
    "deviceName": "iPhone 15 Simulator"
  }'
```

### 4.2 Update Notification Preferences
```bash
curl -X PATCH "http://localhost:3000/v1/notifications/preferences" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "TOKEN_ID_FROM_STEP_4.1",
    "preferences": "{\"breakingNews\": true, \"dailyDigest\": false}"
  }'
```

### 4.3 Delete Device Token
```bash
curl -X DELETE "http://localhost:3000/v1/notifications/token/TOKEN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4.4 Simulate Push Notification (Raw Test)
Use this to test if your device receives notifications correctly.
```bash
curl -X POST "http://localhost:3000/v1/notifications/simulate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "raw",
    "title": "Test Push Notification",
    "body": "This is a test push notification from the server."
  }'
```

### 4.5 Simulate Article Push Notification
Fetches a real article from WordPress and sends it as a notification to your registered devices.
```bash
curl -X POST "http://localhost:3000/v1/notifications/simulate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "article",
    "articleId": "12345"
  }'
```

---

## 5. Token Refresh

### 5.1 Refresh Access Token
```bash
curl -X POST "http://localhost:3000/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 5.2 Logout (Revoke Session)
```bash
curl -X POST "http://localhost:3000/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## Testing Checklist

| Feature | Test Case | Status |
|---------|-----------|--------|
| Auth | Request OTP | [ ] |
| Auth | Verify OTP & Login | [ ] |
| Auth | Refresh Token | [ ] |
| Auth | Logout | [ ] |
| Feed | Get Main Feed | [ ] |
| Feed | Get Category Feed | [ ] |
| Feed | Get Issues | [ ] |
| Feed | Get Latest Issue | [ ] |
| Bookmarks | Create Bookmark | [ ] |
| Bookmarks | List Bookmarks | [ ] |
| Bookmarks | Delete Bookmark | [ ] |
| Notifications | Register Device Token | [ ] |
| Notifications | Update Preferences | [ ] |
| Notifications | Simulate Raw Push | [ ] |
| Notifications | Simulate Article Push | [ ] |
| Notifications | Delete Device Token | [ ] |

---

## Common Issues

### "No Push Tokens Found"
Ensure you have registered at least one device token via `POST /v1/notifications/token` before attempting to simulate notifications.

### "Article Not Found"
When simulating article push, ensure the `articleId` is a valid WordPress post ID. You can find valid IDs from the feed responses.

### "Unauthorized"
Your access token may have expired. Use `POST /v1/auth/refresh` to get a new one, or re-authenticate via OTP.
