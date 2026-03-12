import app from './app';
import { config } from './utils/config';
import { fetchFeed } from './services/wordpress';
import { startBackgroundPolling } from './services/polling';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);

  // Cache Warming: Fetch the first page of the main feed immediately
  // so the first user doesn't experience a cold start delay.
  fetchFeed(1, 10).then(() => {
    console.log('🔥 Initial cache warming complete.');
  }).catch((err) => {
    console.error('⚠️ Failed to warm cache on startup:', err);
  });

  // Start the background poller to silently update the cache if WP changes
  startBackgroundPolling();
});

export default server;
