"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackgroundPolling = exports.pollWordPressUpdates = void 0;
const cache_1 = require("../utils/cache");
const wordpress_1 = require("./wordpress");
const notification_1 = require("./notification");
const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const pollWordPressUpdates = async () => {
    const lockKey = 'polling_lock';
    const acquired = await cache_1.cache.acquireLock(lockKey, 60);
    if (!acquired) {
        console.log('Background polling lock is held by another instance or Redis is down. Skipping...');
        return;
    }
    console.log('Checking for WordPress updates...');
    const freshFeed = await (0, wordpress_1.fetchFeed)(1, 10, true);
    const freshArticles = freshFeed.data;
    if (freshArticles.length === 0)
        return;
    const latestFreshArticle = freshArticles[0];
    const defaultParams = new URLSearchParams({
        page: '1',
        per_page: '10',
        categories_exclude: '1407',
        _embed: 'true'
    });
    const cacheKey = `wp_${defaultParams.toString()}`;
    const cachedFeed = await cache_1.cache.get(cacheKey);
    let shouldUpdate = false;
    let shouldSendNewArticlePush = false;
    if (!cachedFeed || cachedFeed.data.length === 0) {
        shouldUpdate = true;
    }
    else {
        const latestCachedArticle = cachedFeed.data[0];
        const freshDate = new Date(latestFreshArticle.modifiedAt).getTime();
        const cachedDate = new Date(latestCachedArticle.modifiedAt).getTime();
        if (latestFreshArticle.id !== latestCachedArticle.id) {
            shouldUpdate = true;
            shouldSendNewArticlePush = true;
        }
        else if (freshDate > cachedDate) {
            shouldUpdate = true;
        }
    }
    if (shouldUpdate) {
        console.log('WordPress update detected. Flushing cache and re-warming main feed.');
        await cache_1.cache.flushAll();
        await cache_1.cache.set(cacheKey, freshFeed);
        if (shouldSendNewArticlePush) {
            const result = await (0, notification_1.sendNewArticleNotification)(latestFreshArticle);
            console.log(`New article notification result: ${result}`);
        }
    }
    else {
        console.log('No updates detected on WordPress.');
    }
};
exports.pollWordPressUpdates = pollWordPressUpdates;
const startBackgroundPolling = () => {
    setInterval(async () => {
        try {
            await (0, exports.pollWordPressUpdates)();
        }
        catch (error) {
            console.error('Error during background polling:', error);
        }
    }, POLLING_INTERVAL_MS);
};
exports.startBackgroundPolling = startBackgroundPolling;
