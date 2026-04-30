import { cache } from '../utils/cache';
import { fetchFeed, LeanArticle } from './wordpress';
import { sendNewArticleNotification } from './notification';

const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const pollWordPressUpdates = async (): Promise<void> => {
  const lockKey = 'polling_lock';
  const acquired = await cache.acquireLock(lockKey, 60);
  if (!acquired) {
    console.log('Background polling lock is held by another instance or Redis is down. Skipping...');
    return;
  }

  console.log('Checking for WordPress updates...');
  const freshFeed = await fetchFeed(1, 10, true);
  const freshArticles = freshFeed.data;

  if (freshArticles.length === 0) return;

  const latestFreshArticle = freshArticles[0];

  const defaultParams = new URLSearchParams({
    page: '1',
    per_page: '10',
    categories_exclude: '1407',
    _embed: 'true'
  });
  const cacheKey = `wp_${defaultParams.toString()}`;

  const cachedFeed = await cache.get<{ data: LeanArticle[], totalPages: number }>(cacheKey);

  let shouldUpdate = false;
  let shouldSendNewArticlePush = false;

  if (!cachedFeed || cachedFeed.data.length === 0) {
    shouldUpdate = true;
  } else {
    const latestCachedArticle = cachedFeed.data[0];

    const freshDate = new Date(latestFreshArticle.modifiedAt).getTime();
    const cachedDate = new Date(latestCachedArticle.modifiedAt).getTime();

    if (latestFreshArticle.id !== latestCachedArticle.id) {
      shouldUpdate = true;
      shouldSendNewArticlePush = true;
    } else if (freshDate > cachedDate) {
      shouldUpdate = true;
    }
  }

  if (shouldUpdate) {
    console.log('WordPress update detected. Flushing cache and re-warming main feed.');
    await cache.flushAll();
    await cache.set(cacheKey, freshFeed);

    if (shouldSendNewArticlePush) {
      const result = await sendNewArticleNotification(latestFreshArticle);
      console.log(`New article notification result: ${result}`);
    }
  } else {
    console.log('No updates detected on WordPress.');
  }
};

export const startBackgroundPolling = () => {
  setInterval(async () => {
    try {
      await pollWordPressUpdates();
    } catch (error) {
      console.error('Error during background polling:', error);
    }
  }, POLLING_INTERVAL_MS);
};
