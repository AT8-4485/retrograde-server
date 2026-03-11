# Testing the Passwordless Authentication Flow

This guide explains how to test the Phase 1.5 Authentication functionality locally using `curl`, even if you haven't set up a real Firebase project or connected the mobile client yet.

## Local Test Mode

To prevent you from having to constantly request actual Firebase magic links to test the backend logic, we have implemented a **Local Test Mode Bypass**.

If you pass the exact string `MOCK_TOKEN_LEON@TEST.COM` as your `firebaseIdToken` while running in development (`NODE_ENV=dev`), the server will completely bypass the real Firebase verification step and proceed to provision a local user for `leon@test.com` and issue real, cryptographically signed JSON Web Tokens (JWTs).

### 1. Verify / Login

Send the mock token to the verify endpoint. This will create the user in SQLite (if they don't exist), create a new active session, and return your `accessToken` and `refreshToken`.

```bash
curl -X POST http://localhost:3000/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"firebaseIdToken":"MOCK_TOKEN_LEON@TEST.COM"}' | jq
```

**What you will see:** A JSON object containing `{ user, tokens: { accessToken, refreshToken } }`. The `accessToken` expires in 15 minutes, while the `refreshToken` lasts for 60 days.

### 2. Testing Protected Routes

You can use the resulting `accessToken` to access endpoints guarded by the `requireAuth` middleware. Add the token to the `Authorization` header as a Bearer token:

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
curl -X GET http://localhost:3000/v1/some-protected-route \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
*(Note: There are currently no protected GET routes implemented in Phase 1.5, but you will use this pattern for the Bookmarks endpoints in Phase 1.6).*

### 3. Refreshing the Session

When your 15-minute `accessToken` expires, your client uses the `refreshToken` to get a new one without requiring another magic link.

```bash
# Replace YOUR_REFRESH_TOKEN with the long-lived token from Step 1
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}' | jq
```

**What you will see:** A fresh `{ accessToken: "..." }`.

### 4. Logging Out (Revoking the Session)

To securely log out, you send the `refreshToken` to the logout route. This route deletes the `Session` from the SQLite database. Once deleted, that specific refresh token can never be used again to mint new access tokens.

```bash
# Replace YOUR_REFRESH_TOKEN with the token from Step 1
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

**What you will see:** A blank `204 No Content` response. If you attempt to use that same refresh token in the `/refresh` route from Step 3 again, the server will now reject it with a `401 Unauthorized` error.
