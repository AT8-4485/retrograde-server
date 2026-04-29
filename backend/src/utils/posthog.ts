import { PostHog } from 'posthog-node';
import { config } from './config';

export const posthog = new PostHog(config.POSTHOG_PROJECT_TOKEN || '', {
  host: config.POSTHOG_HOST,
  // Disable if the token isn't provided (e.g., in local dev without env vars)
  disabled: !config.POSTHOG_PROJECT_TOKEN,
  // Flush events frequently since this is a server handling stateless requests
  flushAt: 1,
  flushInterval: 0
});
