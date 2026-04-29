Step 3: Implement Required Server-Side Tracking (rg-app-server)
*   Action: Integrate PostHog into the Cloudflare Worker backend.
*   Reason: The PostHog integration guide requires server-side events for all instrumentable server-side code (especially data mutations and auth).
*   Implementation:
    *   Install posthog-node inside the rg-app-server project.
    *   Add POSTHOG_PROJECT_TOKEN to the Cloudflare Worker environment (wrangler.toml / worker-configuration.d.ts).
    *   Initialize the PostHog client safely for Cloudflare Workers (using c.executionCtx.waitUntil(posthog.shutdown()) or explicit .flush() to ensure events fire before the V8 isolate sleeps).
    *   Instrument critical data endpoints, specifically tracking task_created inside TaskCreate.ts and task_deleted inside TaskDelete.ts.

1. Install the PostHog Node SDK
In your auth server repository, install the official PostHog Node SDK:
npm install posthog-node
2. Configure Environment Variables
In your Railway project settings, add the same PostHog environment variables you used in the mobile app:
- POSTHOG_PROJECT_TOKEN: Your project token (starts with phc_...)
- POSTHOG_HOST: Your PostHog host (usually https://us.i.posthog.com or https://eu.i.posthog.com)
3. Initialize the PostHog Client
Create a file (e.g., utils/posthog.ts or lib/posthog.ts) to initialize the client singleton:
import { PostHog } from 'posthog-node'
export const posthog = new PostHog(process.env.POSTHOG_PROJECT_TOKEN || '', {
  host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  // Disable if the token isn't provided (e.g., in local dev without env vars)
  disabled: !process.env.POSTHOG_PROJECT_TOKEN,
  // Flush events frequently since this is a server handling stateless requests
  flushAt: 1,
  flushInterval: 0
})
// VERY IMPORTANT: Ensure PostHog flushes its queue before the server process exits
process.on('SIGINT', async () => {
  await posthog.shutdown()
  process.exit(0)
})
4. Instrument the Auth Endpoints
You need to capture events in your route handlers, specifically grabbing the correlation headers sent by the React Native app.
For POST /v1/auth/request-otp:
import { posthog } from '../utils/posthog'
app.post('/v1/auth/request-otp', async (req, res) => {
  const { email } = req.body;
  
  // Extract correlation headers from the mobile app
  const distinctId = req.headers['x-posthog-distinct-id'] as string;
  const sessionId = req.headers['x-posthog-session-id'] as string;
  // ... your existing OTP logic ...
  // Track the event, linking the anonymous mobile distinctId to the email
  posthog.capture({
    distinctId: distinctId || email, // Fallback to email if header is missing
    event: 'otp_requested_server',
    properties: {
      $session_id: sessionId, // Correlates this event with the mobile session
      email: email
    }
  });
  return res.json({ success: true });
});
For POST /v1/auth/verify-otp:
import { posthog } from '../utils/posthog'
app.post('/v1/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  
  // Extract correlation headers
  const distinctId = req.headers['x-posthog-distinct-id'] as string;
  const sessionId = req.headers['x-posthog-session-id'] as string;
  // ... your existing verify logic ...
  // Assume `user` is fetched/created from DB and has `user.id`
  // 1. Alias the anonymous distinctId from mobile to the canonical user ID
  if (distinctId && distinctId !== user.id) {
    posthog.alias({
      distinctId: user.id,
      alias: distinctId
    });
  }
  // 2. Identify the user (updates user properties in PostHog)
  posthog.identify({
    distinctId: user.id,
    properties: {
      email: user.email,
      // Add any other relevant user info here
    }
  });
  // 3. Capture the login success event
  posthog.capture({
    distinctId: user.id,
    event: 'user_signed_in_server',
    properties: {
      $session_id: sessionId,
      email: user.email
    }
  });
  return res.json({ accessToken, refreshToken, user });
});
5. Deploy to Railway
Commit these changes and push to your Railway-connected repository. Once deployed, the server-side events (otp_requested_server and user_signed_in_server) will automatically stitch together with the client-side events we set up earlier (otp_requested and user_signed_in), because they share the same $session_id and are correctly aliased.