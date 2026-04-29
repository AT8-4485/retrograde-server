"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./utils/config");
const wordpress_1 = require("./services/wordpress");
const polling_1 = require("./services/polling");
const cache_1 = require("./utils/cache");
const posthog_1 = require("./utils/posthog");
const port = config_1.config.PORT;
const startServer = async () => {
    // Connect to Redis before accepting traffic
    await cache_1.cache.connect();
    const server = app_1.default.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
        // Cache Warming: Fetch the first page of the main feed immediately
        // so the first user doesn't experience a cold start delay.
        (0, wordpress_1.fetchFeed)(1, 10).then(() => {
            console.log('🔥 Initial cache warming complete.');
        }).catch((err) => {
            console.error('⚠️ Failed to warm cache on startup:', err);
        });
        // Start the background poller to silently update the cache if WP changes
        (0, polling_1.startBackgroundPolling)();
    });
    // Graceful Shutdown
    const shutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
        await posthog_1.posthog.shutdown();
        server.close(async () => {
            console.log('HTTP server closed.');
            await cache_1.cache.quit();
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
exports.default = startServer; // Export for testing/flexibility if needed
