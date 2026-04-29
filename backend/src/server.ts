import app from './app';
import { config } from './utils/config';
import { fetchFeed } from './services/wordpress';
import { startBackgroundPolling } from './services/polling';
import { cache } from './utils/cache';
import { posthog } from './utils/posthog';

const port = config.PORT;

const startServer = async () => {
  // Connect to Redis before accepting traffic
  await cache.connect();

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

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    await posthog.shutdown();
    server.close(async () => {
      console.log('HTTP server closed.');
      await cache.quit();
      process.exit(0);
    });

    // Force quit if shutting down takes too long
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

export default startServer; // Export for testing/flexibility if needed
