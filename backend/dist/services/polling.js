"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackgroundPolling = void 0;
const cache_1 = require("../utils/cache");
const wordpress_1 = require("./wordpress");
const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const startBackgroundPolling = () => {
    setInterval(async () => {
        try {
            // 1. Fetch the latest page directly from WP (bypassing our node-cache)
            const freshFeed = await (0, wordpress_1.fetchFeed)(1, 10, true);
            const freshArticles = freshFeed.data;
            if (freshArticles.length === 0)
                return;
            const latestFreshArticle = freshArticles[0];
            // 2. Fetch what we currently have cached for page 1
            const defaultParams = new URLSearchParams({
                page: '1',
                per_page: '10',
                categories_exclude: '1407', // ISSUE category
                _embed: 'true'
            });
            const cacheKey = `wp_${defaultParams.toString()}`;
            const cachedFeed = cache_1.cache.get(cacheKey);
            let shouldUpdate = false;
            if (!cachedFeed || cachedFeed.data.length === 0) {
                shouldUpdate = true;
            }
            else {
                const latestCachedArticle = cachedFeed.data[0];
                // Check if there is a new article OR if the existing newest article was modified
                const freshDate = new Date(latestFreshArticle.modifiedAt).getTime();
                const cachedDate = new Date(latestCachedArticle.modifiedAt).getTime();
                if (latestFreshArticle.id !== latestCachedArticle.id || freshDate > cachedDate) {
                    shouldUpdate = true;
                }
            }
            // 3. If a change is detected, invalidate the entire cache to ensure all 
            // categories, issues, and specific routes are purged of stale data
            if (shouldUpdate) {
                console.log('🔄 WordPress update detected. Flushing cache and re-warming main feed.');
                cache_1.cache.flushAll();
                // Save the freshly fetched data back into the cache to warm it
                cache_1.cache.set(cacheKey, freshFeed);
            }
        }
        catch (error) {
            console.error('Error during background polling:', error);
        }
    }, POLLING_INTERVAL_MS);
};
exports.startBackgroundPolling = startBackgroundPolling;
